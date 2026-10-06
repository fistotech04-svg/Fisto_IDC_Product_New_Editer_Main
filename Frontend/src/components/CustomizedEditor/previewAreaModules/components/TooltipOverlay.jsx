import React from 'react';
import { motion } from 'framer-motion';

const TooltipOverlay = React.memo(({ tooltip }) => {
    if (!tooltip) return null;
    const { abs, settings } = tooltip;
    if (!settings || !abs) return null;

    const shape = settings.shape || 'bottom-center';
    let cx = abs.left + abs.width / 2;
    let ty = abs.top;

    let containerStyle = {
        position: 'fixed',
        zIndex: 99999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center'
    };

    let tailStyle = {
        width: 0,
        height: 0
    };

    if (shape.startsWith('bottom')) {
        ty = abs.top;
        let transform = 'translate(-50%, -100%)';
        let tailAlign = { alignSelf: 'center' };

        if (shape === 'bottom-left') {
            cx = abs.left;
            transform = 'translate(0%, -100%)';
            tailAlign = { alignSelf: 'flex-start', marginLeft: '12px' };
        } else if (shape === 'bottom-right') {
            cx = abs.left + abs.width;
            transform = 'translate(-100%, -100%)';
            tailAlign = { alignSelf: 'flex-end', marginRight: '12px' };
        } else {
            cx = abs.left + abs.width / 2;
        }

        containerStyle = {
            ...containerStyle,
            left: cx + 'px',
            top: ty + 'px',
            transform,
            marginTop: '-8px',
            flexDirection: 'column'
        };
        tailStyle = {
            ...tailStyle,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '9px solid ' + (settings.bgColor || '#1F2937'),
            order: 2,
            marginTop: '-1px',
            ...tailAlign
        };
    } else if (shape.startsWith('top')) {
        ty = abs.top + abs.height;
        let transform = 'translate(-50%, 0%)';
        let tailAlign = { alignSelf: 'center' };

        if (shape === 'top-left') {
            cx = abs.left;
            transform = 'translate(0%, 0%)';
            tailAlign = { alignSelf: 'flex-start', marginLeft: '12px' };
        } else if (shape === 'top-right') {
            cx = abs.left + abs.width;
            transform = 'translate(-100%, 0%)';
            tailAlign = { alignSelf: 'flex-end', marginRight: '12px' };
        } else {
            cx = abs.left + abs.width / 2;
        }

        containerStyle = {
            ...containerStyle,
            left: cx + 'px',
            top: ty + 'px',
            transform,
            marginTop: '8px',
            flexDirection: 'column'
        };
        tailStyle = {
            ...tailStyle,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: '9px solid ' + (settings.bgColor || '#1F2937'),
            order: 1,
            marginBottom: '-1px',
            ...tailAlign
        };
    } else if (shape.startsWith('right')) {
        cx = abs.left;
        let transform = 'translate(-100%, -50%)';
        let tailAlign = { alignSelf: 'center' };

        if (shape === 'right-top') {
            ty = abs.top;
            transform = 'translate(-100%, 0%)';
            tailAlign = { alignSelf: 'flex-start', marginTop: '8px' };
        } else if (shape === 'right-bottom') {
            ty = abs.top + abs.height;
            transform = 'translate(-100%, -100%)';
            tailAlign = { alignSelf: 'flex-end', marginBottom: '8px' };
        } else {
            ty = abs.top + abs.height / 2;
        }

        containerStyle = {
            ...containerStyle,
            left: cx + 'px',
            top: ty + 'px',
            transform,
            marginLeft: '-8px',
            flexDirection: 'row'
        };
        tailStyle = {
            ...tailStyle,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderLeft: '9px solid ' + (settings.bgColor || '#1F2937'),
            order: 2,
            marginLeft: '-1px',
            ...tailAlign
        };
    } else if (shape.startsWith('left')) {
        cx = abs.left + abs.width;
        let transform = 'translate(0%, -50%)';
        let tailAlign = { alignSelf: 'center' };

        if (shape === 'left-top') {
            ty = abs.top;
            transform = 'translate(0%, 0%)';
            tailAlign = { alignSelf: 'flex-start', marginTop: '8px' };
        } else if (shape === 'left-bottom') {
            ty = abs.top + abs.height;
            transform = 'translate(0%, -100%)';
            tailAlign = { alignSelf: 'flex-end', marginBottom: '8px' };
        } else {
            ty = abs.top + abs.height / 2;
        }

        containerStyle = {
            ...containerStyle,
            left: cx + 'px',
            top: ty + 'px',
            transform,
            marginLeft: '8px',
            flexDirection: 'row'
        };
        tailStyle = {
            ...tailStyle,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: '9px solid ' + (settings.bgColor || '#1F2937'),
            order: 1,
            marginRight: '-1px',
            ...tailAlign
        };
    }

    const isReversedOrder = shape.startsWith('top') || shape.startsWith('left');

    const rawAnimType = settings.animation || settings.animationStyle || 'Default';
    const animType = rawAnimType.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    const speed = (settings.speed || settings.animationSpeed || 'Medium').toLowerCase();
    const durationMap = {
        'slow': 0.8,
        'medium': 0.5,
        'fast': 0.25
    };
    const duration = durationMap[speed] || 0.5;

    let outerVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration, ease: 'easeOut' } },
        exit: { opacity: 0, transition: { duration: duration * 0.8, ease: 'easeIn' } }
    };

    if (animType === 'Default') {
        outerVariants = {
            initial: { opacity: 1 },
            animate: { opacity: 1, transition: { duration: 0 } },
            exit: { opacity: 0, transition: { duration: 0 } }
        };
    }

    let innerVariants = {
        initial: {},
        animate: {},
        exit: {}
    };

    if (animType === 'Slide Up') {
        innerVariants = {
            initial: { y: 24 },
            animate: { y: 0, transition: { duration, ease: [0.16, 1, 0.3, 1] } },
            exit: { y: 16, transition: { duration: duration * 0.8, ease: [0.7, 0, 0.84, 0] } }
        };
    } else if (animType === 'Zoom In') {
        innerVariants = {
            initial: { scale: 0.7 },
            animate: { scale: 1, transition: { duration, ease: [0.16, 1, 0.3, 1] } },
            exit: { scale: 0.75, transition: { duration: duration * 0.8, ease: [0.7, 0, 0.84, 0] } }
        };
    } else if (animType === 'Bounce In') {
        const getBounceTransition = (s) => {
            if (s === 'slow') return { type: 'spring', stiffness: 60, damping: 10, mass: 1.2 };
            if (s === 'fast') return { type: 'spring', stiffness: 180, damping: 15, mass: 0.8 };
            return { type: 'spring', stiffness: 100, damping: 12, mass: 1.0 };
        };
        innerVariants = {
            initial: { scale: 0.4 },
            animate: {
                scale: 1,
                transition: getBounceTransition(speed)
            },
            exit: { scale: 0.75, transition: { duration: duration * 0.8, ease: 'easeIn' } }
        };
    }

    const outerContainerStyle = {
        position: 'fixed',
        left: containerStyle.left,
        top: containerStyle.top,
        zIndex: 99999,
        pointerEvents: 'none'
    };

    const middleWrapperStyle = {
        transform: containerStyle.transform,
        marginTop: containerStyle.marginTop || '0px',
        marginLeft: containerStyle.marginLeft || '0px',
        display: 'flex',
        flexDirection: containerStyle.flexDirection,
        alignItems: 'center'
    };

    return (
        <motion.div
            variants={outerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={outerContainerStyle}
        >
            <div style={middleWrapperStyle}>
                <motion.div
                    variants={innerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{
                        display: 'flex',
                        flexDirection: containerStyle.flexDirection,
                        alignItems: 'center',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    {(() => {
                        const isAutoWidth = settings.isInfoBox || settings.isWidthAuto;
                        const isAutoHeight = settings.isInfoBox || settings.isHeightAuto;

                        return (
                            <>
                                <div
                                    style={{
                                        backgroundColor: settings.bgColor || '#1F2937',
                                        color: settings.textColor || '#FFFFFF',
                                        fontFamily: settings.fontFamily || 'sans-serif',
                                        fontWeight: settings.bold ? 'bold' : (settings.fontWeight === 'Bold' ? '800' : settings.fontWeight === 'Semi Bold' ? '600' : settings.fontWeight === 'Medium' ? '500' : settings.fontWeight === 'Regular' ? '400' : settings.fontWeight === 'Light' ? '200' : settings.fontWeight === 'Extra Light' ? '100' : settings.fontWeight === 'Thin' ? '50' : 'normal'),
                                        fontStyle: settings.italic ? 'italic' : 'normal',
                                        fontSize: Math.max(9, (settings.fontSize || 14)) + 'px',
                                        textAlign: settings.align || 'center',
                                        textDecoration: [settings.underline ? 'underline' : '', settings.lineThrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
                                        width: isAutoWidth ? 'auto' : ((settings.w || 100) + 'px'),
                                        minWidth: isAutoWidth ? 'max-content' : undefined,
                                        maxWidth: isAutoWidth ? '85vw' : undefined,
                                        height: isAutoHeight ? 'auto' : ((settings.h || 60) + 'px'),
                                        minHeight: 'auto',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        wordBreak: isAutoWidth ? 'normal' : 'break-word',
                                        whiteSpace: isAutoWidth ? 'nowrap' : 'pre-wrap',
                                        padding: settings.isInfoBox ? '8px 16px' : (isAutoWidth ? '8px 14px' : '7px 14px'),
                                        borderRadius: '7px',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                                        order: isReversedOrder ? 2 : 1
                                    }}
                                >
                                    <div
                                        style={{
                                            width: isAutoWidth ? 'auto' : ((settings.textW || 80) + 'px'),
                                            height: isAutoHeight ? 'auto' : ((settings.textH || 40) + 'px'),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: settings.align === 'left' ? 'flex-start' : settings.align === 'right' ? 'flex-end' : 'center',
                                            wordBreak: isAutoWidth ? 'normal' : 'break-word',
                                            whiteSpace: isAutoWidth ? 'nowrap' : 'pre-wrap'
                                        }}
                                    >
                                        {settings.text || (settings.isInfoBox ? 'Info' : 'Tooltip')}
                                    </div>
                                </div>
                                <div style={tailStyle} />
                            </>
                        );
                    })()}
                </motion.div>
            </div>
        </motion.div>
    );
});


export default TooltipOverlay;
