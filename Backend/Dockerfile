FROM node:22-bookworm

WORKDIR /app

# Install system utilities:
# - assimp-utils: for 3D model conversions to GLB
# - inkscape: for PDF-to-SVG vector conversions with outlined text
# - fonts: standard fonts for accurate glyph and text rendering
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      assimp-utils \
      inkscape \
      fonts-dejavu-core \
      fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

# Default binary paths and port for Linux container environment
ENV PORT=5000 \
    ASSIMP_PATH=/usr/bin/assimp \
    INKSCAPE_PATH=/usr/bin/inkscape

COPY package*.json ./

RUN npm install

COPY . .

# Ensure temp and upload directories exist
RUN mkdir -p temp_uploads/pdf_uploads temp_uploads/flipbook_assets temp_uploads/branding_assets uploads

EXPOSE 5000

CMD ["npm", "start"]