// ====================================================================
// PDF EXPORTER MODULE (js/music-lab/music-lab-pdfExporter.js)
// ====================================================================

export async function downloadSheetMusicPDF() {
  const statusMsg = document.getElementById('statusMsg');
  const paperEl = document.querySelector('#paper svg');

  if (!paperEl) {
    if (statusMsg) {
      statusMsg.textContent = "No sheet music found to export.";
      statusMsg.style.color = "#e07a5f";
    }
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    if (statusMsg) {
      statusMsg.textContent = "⚠️ jsPDF library not loaded. Make sure jsPDF CDN is in HTML.";
      statusMsg.style.color = "#e07a5f";
    }
    return;
  }

  try {
    if (statusMsg) {
      statusMsg.textContent = "Generating PDF document...";
      statusMsg.style.color = "#d2daab";
    }

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(paperEl);

    if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Failed to render SVG image for PDF conversion."));
      img.src = blobURL;
    });

    const canvas = document.createElement('canvas');
    const scale = 2;
    const bbox = paperEl.getBoundingClientRect();
    const renderWidth = bbox.width || 800;
    const renderHeight = bbox.height || 400;

    canvas.width = renderWidth * scale;
    canvas.height = renderHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, renderWidth, renderHeight);

    URL.revokeObjectURL(blobURL);

    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    const margin = 20;
    const printWidth = pdfWidth - (margin * 2);
    const printHeight = (canvas.height / canvas.width) * printWidth;

    doc.addImage(
      imgData, 
      'PNG', 
      margin, 
      margin, 
      printWidth, 
      Math.min(printHeight, pdfHeight - (margin * 2))
    );

    const projectName = document.getElementById('projectNameInput')?.value || 'Composition';
    doc.save(`${projectName.replace(/\s+/g, '_')}_SheetMusic.pdf`);

    if (statusMsg) {
      statusMsg.textContent = "✓ PDF downloaded successfully!";
      statusMsg.style.color = "#b5be8a";
    }
  } catch (err) {
    console.error("PDF creation error:", err);
    if (statusMsg) {
      statusMsg.textContent = "Error creating PDF file: " + err.message;
      statusMsg.style.color = "#e07a5f";
    }
  }
}