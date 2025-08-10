
import html2pdf from 'html2pdf.js'
import { FlyerData, FlyerTemplate } from '@/types/flyer'

export const generatePDF = async (
  template: FlyerTemplate,
  flyerData: FlyerData,
  qrCodeUrl?: string
): Promise<void> => {
  // Create a temporary container for the PDF content
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  document.body.appendChild(container)

  try {
    // Generate the HTML content for the flyer
    const htmlContent = generateFlyerHTML(template, flyerData, qrCodeUrl)
    container.innerHTML = htmlContent

    // Configure PDF options based on template size
    const pdfOptions = getPDFOptions(template.size)

    // Generate and download the PDF
    await html2pdf()
      .set(pdfOptions)
      .from(container)
      .save(`${generateFileName(flyerData)}.pdf`)

  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}

const generateFileName = (flyerData: FlyerData): string => {
  const locationName = flyerData.locationName || flyerData.businessName || 'Flyer'
  const date = new Date().toISOString().split('T')[0]
  return `Flyer_${locationName.replace(/\s+/g, '_')}_${date}`
}

const getPDFOptions = (size: string) => {
  const baseOptions = {
    margin: 0,
    filename: 'flyer.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null
    },
    jsPDF: { unit: 'in', orientation: 'portrait' }
  }

  switch (size) {
    case '8.5x11':
      return {
        ...baseOptions,
        jsPDF: { ...baseOptions.jsPDF, format: 'letter' }
      }
    case '11x17':
      return {
        ...baseOptions,
        jsPDF: { ...baseOptions.jsPDF, format: 'tabloid' }
      }
    case 'square':
      return {
        ...baseOptions,
        jsPDF: { ...baseOptions.jsPDF, format: [8, 8] }
      }
    case 'story':
      return {
        ...baseOptions,
        jsPDF: { ...baseOptions.jsPDF, format: [4.5, 8] }
      }
    default:
      return baseOptions
  }
}

const generateFlyerHTML = (
  template: FlyerTemplate,
  flyerData: FlyerData,
  qrCodeUrl?: string
): string => {
  const isDark = flyerData.selectedColors.background === 'hsl(240, 10%, 10%)'
  const textColor = isDark ? '#ffffff' : '#000000'
  
  // Convert HSL to hex for better PDF compatibility
  const primaryColor = hslToHex(flyerData.selectedColors.primary)
  const secondaryColor = hslToHex(flyerData.selectedColors.secondary)
  const accentColor = hslToHex(flyerData.selectedColors.accent)
  const backgroundColor = hslToHex(flyerData.selectedColors.background)

  const sizeStyles = getSizeStyles(template.size)
  const layoutStyles = getLayoutStyles(template.layout || 'bold-header')

  return `
    <div style="
      ${sizeStyles}
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: ${textColor};
      font-family: 'Arial', sans-serif;
      position: relative;
      overflow: hidden;
      padding: 40px;
      box-sizing: border-box;
      ${layoutStyles}
    ">
      <!-- Background Pattern -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background-image: radial-gradient(circle at 20% 20%, ${accentColor} 0%, transparent 50%),
                          radial-gradient(circle at 80% 80%, ${accentColor} 0%, transparent 50%);
      "></div>

      <!-- Content Container -->
      <div style="position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column;">
        
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 30px;">
          ${flyerData.businessName ? `
            <h1 style="
              font-size: ${template.size === 'story' ? '36px' : '48px'};
              font-weight: bold;
              margin: 0 0 15px 0;
              color: ${accentColor};
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              line-height: 1.2;
            ">${flyerData.businessName}</h1>
          ` : ''}
          
          ${flyerData.locationName ? `
            <h2 style="
              font-size: ${template.size === 'story' ? '20px' : '28px'};
              font-weight: 600;
              margin: 0 0 20px 0;
              opacity: 0.9;
            ">${flyerData.locationName}</h2>
          ` : ''}
          
          ${flyerData.specialOffer ? `
            <div style="
              display: inline-block;
              background-color: ${accentColor};
              color: ${backgroundColor};
              padding: 12px 24px;
              border-radius: 25px;
              font-size: ${template.size === 'story' ? '16px' : '20px'};
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
              margin-bottom: 20px;
            ">${flyerData.specialOffer}</div>
          ` : ''}
        </div>

        <!-- Prize Section -->
        ${flyerData.prizeHighlights.length > 0 ? `
          <div style="flex: 1; margin: 30px 0;">
            <h3 style="
              font-size: ${template.size === 'story' ? '20px' : '28px'};
              font-weight: bold;
              text-align: center;
              margin-bottom: 20px;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            ">🏆 Win Amazing Prizes! 🏆</h3>
            
            <div style="
              display: grid;
              grid-template-columns: repeat(${template.size === 'story' ? '1' : '2'}, 1fr);
              gap: 15px;
              max-width: 500px;
              margin: 0 auto;
            ">
              ${flyerData.prizeHighlights.slice(0, template.size === 'story' ? 6 : 8).map(prize => `
                <div style="
                  background-color: rgba(255,255,255,0.15);
                  padding: 15px;
                  border-radius: 12px;
                  backdrop-filter: blur(10px);
                  border: 1px solid rgba(255,255,255,0.2);
                  display: flex;
                  align-items: center;
                  gap: 10px;
                ">
                  <span style="font-size: 18px;">🎁</span>
                  <span style="font-size: 14px; font-weight: 500;">${prize}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Footer Section -->
        <div style="text-align: center; margin-top: auto;">
          ${flyerData.address ? `
            <div style="
              background-color: rgba(255,255,255,0.15);
              padding: 12px 20px;
              border-radius: 10px;
              margin-bottom: 10px;
              backdrop-filter: blur(10px);
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
            ">
              <span>📍</span>
              <span>${flyerData.address}</span>
            </div>
          ` : ''}
          
          <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
            ${flyerData.contactInfo ? `
              <div style="
                background-color: rgba(255,255,255,0.15);
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <span>📞</span>
                <span>${flyerData.contactInfo}</span>
              </div>
            ` : ''}
            
            ${flyerData.socialHandles ? `
              <div style="
                background-color: rgba(255,255,255,0.15);
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <span>📱</span>
                <span>${flyerData.socialHandles}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- QR Code -->
      ${qrCodeUrl ? `
        <div style="
          position: absolute;
          bottom: 20px;
          right: 20px;
          background-color: white;
          padding: 8px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        ">
          <img src="${qrCodeUrl}" style="width: 60px; height: 60px; display: block;" />
        </div>
      ` : ''}
    </div>
  `
}

const getSizeStyles = (size: string): string => {
  switch (size) {
    case '8.5x11':
      return 'width: 816px; height: 1056px;' // 8.5" x 11" at 96 DPI
    case '11x17':
      return 'width: 1056px; height: 1632px;' // 11" x 17" at 96 DPI
    case 'square':
      return 'width: 800px; height: 800px;'
    case 'story':
      return 'width: 432px; height: 768px;' // 9:16 ratio
    default:
      return 'width: 816px; height: 1056px;'
  }
}

const getLayoutStyles = (layout: string): string => {
  switch (layout) {
    case 'modern-clean':
      return 'justify-content: space-between;'
    case 'poster-style':
      return 'text-align: center; justify-content: center;'
    case 'social-square':
      return 'justify-content: center; align-items: center;'
    case 'vertical-story':
      return 'justify-content: space-between; padding: 30px 20px;'
    default:
      return 'justify-content: space-between;'
  }
}

// Helper function to convert HSL to Hex
const hslToHex = (hsl: string): string => {
  // Extract HSL values from string like "hsl(340, 82%, 52%)"
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return '#000000'
  
  const h = parseInt(match[1]) / 360
  const s = parseInt(match[2]) / 100
  const l = parseInt(match[3]) / 100
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  
  let r, g, b
  
  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
