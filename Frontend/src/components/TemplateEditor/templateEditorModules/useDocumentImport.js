/**
 * useDocumentImport.js
 * Handles file ingestion and document conversion (PDF, Word, PowerPoint)
 * for initial import, page append, and page replacement.
 */

import {
  convertPdfWithInkscape,
  generatePdfPageSvg,
  svgToDataUrl,
  isOfficeDocument,
  getOfficeDocType,
  getDocumentDetails
} from '../../../utils/pdfUtils';
import { parseLayersFromSVG } from './svgFilterUtils';

export const useDocumentImport = ({
  pages,
  setPages,
  saveToHistory,
  setHasUnsavedChanges,
  setPdfProcessing,
  setAlertState,
  getFlipbookDimensions,
  pdfInputRef,
  replacePdfInputRef,
  pdfInsertIndexRef,
  replacePageIndexRef,
  v_id,
  activePageIndex
}) => {
    const handleAddFileClick = (index) => {
    pdfInsertIndexRef.current = index;
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
      pdfInputRef.current.click();
    }
  };

  const handleReplaceFileClick = (index) => {
    replacePageIndexRef.current = index;
    if (replacePdfInputRef.current) {
      replacePdfInputRef.current.value = '';
      replacePdfInputRef.current.click();
    }
  };

  const handleReplaceFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isDoc = file.type === 'application/pdf' ||
                  file.name.toLowerCase().endsWith('.pdf') ||
                  isOfficeDocument(file.name);

    if (!isDoc) {
      setAlertState({
        isOpen: true,
        title: 'Invalid File',
        message: 'Please select a valid PDF, Word, or PowerPoint file (.pdf, .doc, .docx, .ppt, .pptx).',
        type: 'error'
      });
      return;
    }

    e.target.value = '';

    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const emailId = user?.emailId;

    if (!emailId || !v_id) return;

    const docType = getOfficeDocType(file.name);
    const docLabel = docType === 'powerpoint' ? 'PowerPoint presentation' : (docType === 'word' ? 'Word document' : 'PDF');

    // 1. FAST PRE-CHECK: Check dimensions BEFORE starting conversion
    setPdfProcessing({ current: 0, total: 1, message: 'Checking document dimensions...', fileName: file.name });

    // Determine target page dimensions
    const replaceIndex = replacePageIndexRef.current !== null ? replacePageIndexRef.current : activePageIndex;
    const targetPage = pages[replaceIndex];
    let baseWidth = null;
    let baseHeight = null;

    if (targetPage && targetPage.html) {
      const match = targetPage.html.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
      if (match && parseFloat(match[3]) > 0 && parseFloat(match[4]) > 0) {
        baseWidth = parseFloat(match[3]);
        baseHeight = parseFloat(match[4]);
      }
    }

    if (!baseWidth || !baseHeight) {
      const flipDims = getFlipbookDimensions();
      baseWidth = flipDims.width;
      baseHeight = flipDims.height;
    }

    let details = null;
    try {
      details = await getDocumentDetails(file, backendUrl);
    } catch (inspectErr) {
      console.error("Document dimension pre-check failed:", inspectErr);
    }

    if (!details || !details.width || !details.height) {
      setPdfProcessing(null);
      setAlertState({
        isOpen: true,
        title: 'Unable to Verify Dimensions',
        message: `Could not verify the dimensions of "${file.name}". Please ensure the file is a valid, readable document.`,
        type: 'error'
      });
      return;
    }

    // Check internal uniformity of incoming document
    if (!details.isUniform) {
      setPdfProcessing(null);
      setAlertState({
        isOpen: true,
        title: `Non-Uniform ${docType === 'powerpoint' ? 'Presentation' : (docType === 'word' ? 'Document' : 'PDF')}`,
        message: `The selected ${docLabel} contains ${docType === 'powerpoint' ? 'slides' : 'pages'} with different sizes. For a consistent flipbook, all ${docType === 'powerpoint' ? 'slides' : 'pages'} must have identical dimensions.`,
        type: 'error'
      });
      return;
    }

    // Enforce dimension match before starting conversion (2mm tolerance for rounding)
    const widthMatch = Math.abs(details.width - baseWidth) <= 2;
    const heightMatch = Math.abs(details.height - baseHeight) <= 2;

    if (!widthMatch || !heightMatch) {
      setPdfProcessing(null);
      setAlertState({
        isOpen: true,
        title: 'Dimension Mismatch',
        message: `This file (${details.width.toFixed(0)} × ${details.height.toFixed(0)} mm) does not match the page size (${baseWidth.toFixed(0)} × ${baseHeight.toFixed(0)} mm). Please upload a file with matching dimensions.`,
        type: 'error'
      });
      return;
    }

    // 2. START CONVERSION (Dimensions confirmed matching 100%)
    setPdfProcessing({
      current: 0,
      total: 1,
      totalFiles: 1,
      pageCount: 1,
      message: `Processing replacement ${docLabel}...`,
      fileName: file.name,
      stage: 'converting'
    });

    try {
      const images = await convertPdfWithInkscape(file, 1);
      if (!images || images.length === 0) return;

      const image = images[0];
      const firstW = image.width;
      const firstH = image.height;

      const imgWidthMatch = Math.abs(firstW - baseWidth) <= 2;
      const imgHeightMatch = Math.abs(firstH - baseHeight) <= 2;

      if (!imgWidthMatch || !imgHeightMatch) {
        setAlertState({
          isOpen: true,
          title: 'Dimension Mismatch',
          message: `This file (${firstW.toFixed(0)} × ${firstH.toFixed(0)} mm) does not match the existing flipbook size (${baseWidth.toFixed(0)} × ${baseHeight.toFixed(0)} mm). Please upload a file with matching dimensions.`,
          type: 'error'
        });
        return;
      }

      const base64Data = image.dataUrl || (image.content ? svgToDataUrl(image.content) : "") || (image.svgString ? svgToDataUrl(image.svgString) : "") || await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(image.blob);
      });

      saveToHistory();

      setPages(prev => {
        const updated = [...prev];
        const pageIndex = replacePageIndexRef.current;
        const page = updated[pageIndex];
        if (!page) return prev;
        const updatedPage = { ...page };

        const pageName = updatedPage.name || `Page ${pageIndex + 1}`;
        const absoluteHtml = image.content || generatePdfPageSvg(base64Data, pageName, baseWidth, baseHeight, true);
        const parser = new DOMParser();
        const doc = parser.parseFromString(absoluteHtml, 'image/svg+xml');
        updatedPage.html = absoluteHtml;
        updatedPage.layers = parseLayersFromSVG(doc.documentElement);

        updated[pageIndex] = updatedPage;
        return updated;
      });

      setHasUnsavedChanges(true);

    } catch (error) {
      console.error("Error replacing file:", error);
      const rawMsg = error.response?.data?.message || error.message || "";
      const isCorrupt = error.response?.data?.isCorrupted ||
                        /corrupt|cannot be read|not be loaded|damaged|password|format error|failed to parse|invalid pdf|syntax error/i.test(rawMsg);
      const userMessage = isCorrupt
        ? (rawMsg.includes("is corrupted") || rawMsg.includes("corrupted, unreadable") ? rawMsg : `Your ${docLabel} "${file.name}" is corrupted, unreadable, or password-protected. Please check the file and try again.`)
        : (rawMsg || `Failed to replace page with ${docLabel}. Please try again.`);
      setAlertState({
        isOpen: true,
        title: isCorrupt ? 'File Corrupted' : 'Error',
        message: userMessage,
        type: 'error'
      });
    } finally {
      setPdfProcessing(null);
      if (replacePdfInputRef.current) replacePdfInputRef.current.value = '';
    }
  };

  const handlePdfFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's a PDF, Word, or PowerPoint file
    const isDoc = file.type === 'application/pdf' ||
                  file.name.toLowerCase().endsWith('.pdf') ||
                  isOfficeDocument(file.name);

    if (!isDoc) {
      setAlertState({
        isOpen: true,
        title: 'Invalid File',
        message: 'Please select a valid PDF, Word, or PowerPoint file (.pdf, .doc, .docx, .ppt, .pptx).',
        type: 'error'
      });
      return;
    }

    // Reset input
    e.target.value = '';

    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const emailId = user?.emailId;

    if (!emailId || !v_id) {
      console.error("Missing emailId or v_id for asset upload");
      return;
    }

    const docType = getOfficeDocType(file.name);
    const docLabel = docType === 'powerpoint' ? 'PowerPoint presentation' : (docType === 'word' ? 'Word document' : 'PDF');
    const unitName = docType === 'powerpoint' ? 'slide' : 'page';

    // 1. FAST PRE-CHECK: Inspect document dimensions & uniformity before conversion starts
    setPdfProcessing({ current: 0, total: 1, message: 'Checking document dimensions...', fileName: file.name });

    let { width: baseWidth, height: baseHeight } = getFlipbookDimensions();

    let details = null;
    try {
      details = await getDocumentDetails(file, backendUrl);
    } catch (inspectErr) {
      console.error("Document dimension pre-check failed:", inspectErr);
    }

    if (!details || !details.width || !details.height) {
      setPdfProcessing(null);
      setAlertState({
        isOpen: true,
        title: 'Unable to Verify Dimensions',
        message: `Could not verify the dimensions of "${file.name}". Please ensure the file is a valid, readable document.`,
        type: 'error'
      });
      return;
    }

    // Check internal uniformity of incoming document
    if (!details.isUniform) {
      setPdfProcessing(null);
      setAlertState({
        isOpen: true,
        title: `Non-Uniform ${docType === 'powerpoint' ? 'Presentation' : (docType === 'word' ? 'Document' : 'PDF')}`,
        message: `The selected ${docLabel} contains ${docType === 'powerpoint' ? 'slides' : 'pages'} with different sizes. For a consistent flipbook, all ${docType === 'powerpoint' ? 'slides' : 'pages'} must have identical dimensions.`,
        type: 'error'
      });
      return;
    }

    // Enforce Project Dimensions before starting conversion
    // When adding to an existing flipbook (or explicit page position), enforce dimension match!
    const isAddingToExisting = pdfInsertIndexRef.current !== null || pages.length > 1 || (pages.length === 1 && pages[0].html && !pages[0].html.includes('data-name="Page 1"'));
    const isDefaultBlank = !isAddingToExisting && pages.length <= 1;

    if (!isDefaultBlank) {
      const widthMatch = Math.abs(details.width - baseWidth) <= 2;
      const heightMatch = Math.abs(details.height - baseHeight) <= 2;

      if (!widthMatch || !heightMatch) {
        setPdfProcessing(null);
        setAlertState({
          isOpen: true,
          title: 'Dimension Mismatch',
          message: `This ${docLabel} (${details.width.toFixed(0)} × ${details.height.toFixed(0)} mm) does not match the existing flipbook size (${baseWidth.toFixed(0)} × ${baseHeight.toFixed(0)} mm). Please upload a file with matching dimensions.`,
          type: 'error'
        });
        return;
      }
    } else {
      baseWidth = details.width;
      baseHeight = details.height;
    }

    // 2. START CONVERSION (Dimensions confirmed matching 100%)
    const detectedTotal = details.count > 0 ? details.count : 1;
    setPdfProcessing({
      current: 0,
      total: detectedTotal,
      totalFiles: 1,
      pageCount: detectedTotal,
      message: `Processing ${docLabel}...`,
      fileName: file.name,
      stage: 'converting'
    });

    try {
      const remainingSlots = Infinity;
      const images = await convertPdfWithInkscape(file, remainingSlots);
      if (!images || images.length === 0) return;

      // Double-check internal uniformity of the rendered images
      const firstW = images[0].width;
      const firstH = images[0].height;
      const isInternalUniform = images.every(img =>
        Math.abs(img.width - firstW) <= 2 &&
        Math.abs(img.height - firstH) <= 2
      );

      if (!isInternalUniform) {
        setAlertState({
          isOpen: true,
          title: `Non-Uniform ${docType === 'powerpoint' ? 'Presentation' : (docType === 'word' ? 'Document' : 'PDF')}`,
          message: `The selected ${docLabel} contains ${docType === 'powerpoint' ? 'slides' : 'pages'} with different sizes. For a consistent flipbook, all ${docType === 'powerpoint' ? 'slides' : 'pages'} must have identical dimensions.`,
          type: 'error'
        });
        return;
      }

      // Enforce Project Dimensions
      if (!isDefaultBlank) {
        const widthMatch = Math.abs(firstW - baseWidth) <= 2;
        const heightMatch = Math.abs(firstH - baseHeight) <= 2;

        if (!widthMatch || !heightMatch) {
          setAlertState({
            isOpen: true,
            title: 'Dimension Mismatch',
            message: `This ${docLabel} (${firstW.toFixed(0)} × ${firstH.toFixed(0)} mm) does not match the existing flipbook size (${baseWidth.toFixed(0)} × ${baseHeight.toFixed(0)} mm). Please upload a file with matching dimensions.`,
            type: 'error'
          });
          return;
        }
      } else {
        baseWidth = firstW;
        baseHeight = firstH;
      }

      let completed = 0;
      const uploadPromises = images.map(async (image, i) => {
        const newPageVId = 'page_' + Math.random().toString(36).substr(2, 9);
        const base64Data = image.dataUrl || (image.content ? svgToDataUrl(image.content) : "") || (image.svgString ? svgToDataUrl(image.svgString) : "") || await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(image.blob);
        });

        completed++;
        setPdfProcessing({ current: completed, total: images.length, message: `Processing ${unitName} ${completed} of ${images.length}...`, fileName: file.name });

        const existingNames = pages.map(p => p.name || "");
        const pdfNums = existingNames
          .filter(n => n.startsWith("PDF Page ") || n.startsWith("Page ") || n.startsWith("Slide "))
          .map(n => parseInt(n.replace(/^(PDF |Slide )?Page /, "").replace(/^Slide /, "")))
          .filter(n => !isNaN(n));
        const startNum = pdfNums.length > 0 ? Math.max(...pdfNums) + 1 : 1;

        const pageName = `Page ${startNum + i}`;
        const absoluteHtml = image.content || generatePdfPageSvg(base64Data, pageName, baseWidth, baseHeight, true);

        const parser = new DOMParser();
        const doc = parser.parseFromString(absoluteHtml, 'image/svg+xml');
        const layers = parseLayersFromSVG(doc.documentElement);

        return {
          id: newPageVId,
          v_id: newPageVId,
          name: pageName,
          html: absoluteHtml,
          layers
        };
      });

      const newPages = await Promise.all(uploadPromises);

      saveToHistory();
      setPages(prev => {
        const updated = [...prev];
        const insertIdx = pdfInsertIndexRef.current !== null ? pdfInsertIndexRef.current + 1 : updated.length;

        // If starting from a blank page, replace it with the document content
        if (isDefaultBlank && updated.length === 1) {
          return newPages;
        }

        updated.splice(insertIdx, 0, ...newPages);
        return updated;
      });
      setHasUnsavedChanges(true);

    } catch (error) {
      console.error("Document upload error:", error);
      const rawMsg = error.response?.data?.message || error.message || "";
      const isCorrupt = error.response?.data?.isCorrupted ||
                        /corrupt|cannot be read|not be loaded|damaged|password|format error|failed to parse|invalid pdf|syntax error/i.test(rawMsg);
      const userMessage = isCorrupt
        ? (rawMsg.includes("is corrupted") || rawMsg.includes("corrupted, unreadable") ? rawMsg : `Your ${docLabel} "${file.name}" is corrupted, unreadable, or password-protected. Please check the file and try again.`)
        : (rawMsg || `Failed to process ${docLabel}. Please ensure the file is valid and try again.`);
      setAlertState({
        isOpen: true,
        title: isCorrupt ? 'File Corrupted' : 'Upload Error',
        message: userMessage,
        type: 'error'
      });
    } finally {
      setPdfProcessing(null);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  return {
    handleAddFileClick,
    handleReplaceFileClick,
    handleReplaceFileSelect,
    handlePdfFileSelect
  };
};
