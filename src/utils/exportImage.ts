import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const exportToShortImages = async (pageCount: number, filename: string) => {
  const zip = new JSZip();
  const imgFolder = zip.folder("images");
  if (!imgFolder) return;

  for (let i = 0; i < pageCount; i++) {
    const element = document.getElementById(`export-page-${i}`);
    if (!element) continue;

    const canvas = await html2canvas(element, { 
      scale: 1,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      windowWidth: 1200,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    imgFolder.file(`${filename}_${i + 1}.png`, base64Data, {base64: true});
  }

  const content = await zip.generateAsync({type:"blob"});
  saveAs(content, `${filename}_短图集.zip`);
};
