// src/components/ConverterSection.tsx
'use client';
import React, { useState, useEffect } from 'react';
import FeatureCard from './FeatureCard';
import Dropzone from './Dropzone';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';
import { API_BASE_URL, convertDigitalPdf, convertImageOcrPdf } from '@/services/apiService'; 

interface FeatureData {
  iconSVG: string; 
  titleKey: string; 
  descriptionKey: string; 
}

interface ConverterSectionProps {
  id: string;
  sectionTitleKey: string;
  sectionSubtitleKey: string;
  featuresData: FeatureData[];
  dropzoneId: string;
  selectedFileId: string; 
  conversionAreaId: string;
  convertBtnId: string;
  loadingSpinnerId: string;
  // downloadConvertedBtnId: string; // Prop removed as button is removed from this component
  // editOnlineBtnId: string; // Prop removed as button is removed from this component
  // summarizeBtnId: string; // Prop removed as button is removed from this component
  progressBarContainerId: string;
  progressBarId: string;
  statusMessageId: string; 
  isImageConverterType: boolean; 
  conversionType: 'digital' | 'image'; 
  onFileSelected: (conversionType: 'digital' | 'image', file: File | null) => void;
  onConversionStart: (conversionType: 'digital' | 'image') => void;
  onConversionSuccess: (conversionType: 'digital' | 'image', downloadUrl: string, previewImageUrls: string[] | null, originalPdfFile: File | null) => void;
  onConversionError: (conversionType: 'digital' | 'image', errorMessage: string) => void;
  docxDownloadUrl?: string | null; // Added new prop
}

type ConversionStatus = 'ready' | 'uploading' | 'converting' | 'success' | 'error' | 'noFile';

const ConverterSection: React.FC<ConverterSectionProps> = ({
  id,
  sectionTitleKey,
  sectionSubtitleKey,
  featuresData,
  dropzoneId,
  selectedFileId,
  conversionAreaId,
  convertBtnId,
  loadingSpinnerId,
  // downloadConvertedBtnId, 
  // editOnlineBtnId, 
  // summarizeBtnId, 
  progressBarContainerId,
  progressBarId,
  statusMessageId, 
  isImageConverterType,
  conversionType, 
  onFileSelected,
  onConversionStart,
  onConversionSuccess,
  onConversionError,
  docxDownloadUrl, // Destructure new prop
}) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [currentSelectedFile, setCurrentSelectedFile] = useState<File | null>(null);
  const [fileNameDisplay, setFileNameDisplay] = useState<string>('');
  
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>('ready');

  console.log(`ConverterSection (${id}): Rendered with docxDownloadUrl:`, docxDownloadUrl, 'Status:', conversionStatus);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(''); 
  const [showConversionArea, setShowConversionArea] = useState<boolean>(false);
  const [showProgressBar, setShowProgressBar] = useState<boolean>(false);
  // const [showDownloadButtonInSection, setShowDownloadButtonInSection] = useState<boolean>(false); // Button removed
  // const [showPreviewButton, setShowPreviewButton] = useState<boolean>(false); // Button removed
  const [convertButtonText, setConvertButtonText] = useState<string>(t('convertBtn'));
  const [isConvertButtonDisabled, setIsConvertButtonDisabled] = useState<boolean>(true); 
  const [showLoadingSpinner, setShowLoadingSpinner] = useState<boolean>(false);
  // const [showSummarizeButton, setShowSummarizeButton] = useState<boolean>(false); // Button removed

  const handleConvertAnother = () => {
    setCurrentSelectedFile(null);
    setFileNameDisplay('');
    setProgress(0);
    setStatusMessage('');
    setConversionStatus('ready');
    setShowProgressBar(false);
    setShowConversionArea(false); // Hide conversion area which includes the main convert button
    setIsConvertButtonDisabled(true); // Ensure main convert button is disabled
    setConvertButtonText(t('convertBtn')); // Reset main convert button text
    onFileSelected(conversionType, null); // Notify page.tsx to clear global states
  };

  const handlePreviewOrEdit = () => {
    document.getElementById('editing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownloadSuccessFile = () => {
    console.log(`ConverterSection (${id}): handleDownloadSuccessFile clicked. URL:`, docxDownloadUrl);
    if (docxDownloadUrl) {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}${docxDownloadUrl}`;
      let filename = "converted_document.docx";
      try {
        const url = new URL(docxDownloadUrl);
        const pathnameParts = url.pathname.split('/');
        const potentialFilename = pathnameParts[pathnameParts.length - 1];
        if (potentialFilename && potentialFilename.includes('.')) {
            filename = potentialFilename;
        }
      } catch (e) { 
        console.warn("Could not parse filename from URL for ConverterSection download.", e); 
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Download button clicked but docxDownloadUrl is not available.");
      showAlert(t('downloadUrlNotReady'), 'error');
    }
  };

  useEffect(() => {
    // 当语言改变时更新状态消息
    if (conversionStatus === 'success') {
      setStatusMessage(t('statusSuccess'));
    } else if (conversionStatus === 'uploading') {
      setStatusMessage(`${t('statusUploading')} (${progress}%)`);
    } else if (conversionStatus === 'converting') {
      setStatusMessage(`${t('statusConverting')} (${progress}%)`);
    } else if (conversionStatus === 'error') {
      setStatusMessage(t('statusError'));
    } else if (conversionStatus === 'noFile') {
      setStatusMessage(t('statusNoFile'));
    } else if (conversionStatus === 'ready' && currentSelectedFile) {
      setStatusMessage(t('statusReady'));
    }
  }, [t, conversionStatus, progress, currentSelectedFile]);

  useEffect(() => {
    const statusMsgElement = document.getElementById(statusMessageId);
    if (statusMsgElement) {
        statusMsgElement.innerHTML = ''; 
        statusMsgElement.className = 'text-center mt-6 text-xl font-medium'; 

        let iconSvg = '';
        if (conversionStatus === 'success') {
            statusMsgElement.classList.add('text-green-500');
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle inline-block mr-2 w-6 h-6 align-middle"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
        } else if (conversionStatus === 'error' || conversionStatus === 'noFile') {
            statusMsgElement.classList.add('text-red-500');
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle inline-block mr-2 w-6 h-6 align-middle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6m0-6 6 6"/></svg>`;
        } else if (conversionStatus === 'uploading' || conversionStatus === 'converting') {
             statusMsgElement.classList.add('text-gray-300'); 
             iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-2 animate-spin mr-3 w-6 h-6 align-middle"></svg>`;
        } else { 
            statusMsgElement.classList.add('text-gray-300');
        }
        statusMsgElement.innerHTML = `${iconSvg} ${statusMessage}`;
    }
  }, [statusMessage, conversionStatus, statusMessageId]);

  useEffect(() => {
    // Simplified: Main convert button text doesn't need to change to "Convert Another" anymore
    // as there's a dedicated button for that.
    if (conversionStatus === 'ready' && currentSelectedFile) {
      setConvertButtonText(t('convertBtn'));
    }
    // If not ready or no file, it might be disabled or show initial text, 
    // which is handled by isConvertButtonDisabled state and initial convertButtonText value.
    // If already converting, uploading, success, or error, the button text shouldn't change here
    // as the button itself might be hidden or replaced.
  }, [t, conversionStatus, currentSelectedFile]);


  const handleFileSelect = (file: File | null) => {
    setCurrentSelectedFile(file); 
    onFileSelected(conversionType, file); 

    if (file) {
      if (file.type === 'application/pdf') {
        setFileNameDisplay(`${t('selectedFile')} ${file.name}`);
        setConversionStatus('ready');
        setStatusMessage(t('statusReady'));
        setShowConversionArea(true);
        setProgress(0);
        setShowProgressBar(false);
        // setShowDownloadButtonInSection(false); 
        // setShowPreviewButton(false);
        // setShowSummarizeButton(false);
        setIsConvertButtonDisabled(false); 
        setConvertButtonText(t('convertBtn'));
        setShowLoadingSpinner(false);
      } else {
        setFileNameDisplay('');
        setConversionStatus('noFile'); 
        const errorMsg = t('invalidFileType');
        setStatusMessage(errorMsg); 
        showAlert(errorMsg); 
        setShowConversionArea(false);
        setIsConvertButtonDisabled(true);
      }
    } else { 
      setFileNameDisplay('');
      setConversionStatus('ready'); 
      setStatusMessage(''); 
      setShowConversionArea(false);
      setShowProgressBar(false);
      // setShowDownloadButtonInSection(false);
      // setShowPreviewButton(false);
      // setShowSummarizeButton(false);
      setIsConvertButtonDisabled(true);
    }
  };

  const handleConvertClick = async () => {
    if (!currentSelectedFile) {
        const errorMsg = t('statusNoFile');
        setConversionStatus('noFile');
        setStatusMessage(errorMsg);
        showAlert(errorMsg);
        onConversionError(conversionType, errorMsg); 
        return;
    }

    onConversionStart(conversionType); 

    setIsConvertButtonDisabled(true);
    setShowLoadingSpinner(true);
    setConvertButtonText('转换中');
    setConversionStatus('uploading');
    setStatusMessage(`${t('statusUploading')} (${progress}%)`);
    setProgress(0); 
    setShowProgressBar(true);

    const handleUploadProgress = (percentage: number) => {
      const newProgress = Math.min(50, Math.round(percentage / 2));
      setProgress(newProgress);
      setStatusMessage(`${t('statusUploading')} (${newProgress}%)`);
    };

    const apiFunction = conversionType === 'digital' ? convertDigitalPdf : convertImageOcrPdf;

    try {
      const response = await apiFunction(currentSelectedFile, handleUploadProgress);
      
      setConversionStatus('converting'); 
      for (let i = 51; i <= 100; i += 7) { 
          setProgress(Math.min(100, i)); 
          setStatusMessage(`${t('statusConverting')} (${Math.min(100, i)}%)`);
          await new Promise(resolve => setTimeout(resolve, 70)); 
      }
      setProgress(100); 

      setConversionStatus('success');
      setStatusMessage(t('statusSuccess'));
      onConversionSuccess(conversionType, response.downloadUrl, response.previewImageUrls, currentSelectedFile); 
      
    } catch (error: any) {
      console.error(`Conversion API error for ${conversionType}:`, error);
      setConversionStatus('error');
      const errorMessage = error.message || t('statusError'); 
      setStatusMessage(errorMessage);
      onConversionError(conversionType, errorMessage);
      showAlert(errorMessage); 
    } finally {
      setIsConvertButtonDisabled(false); 
      setShowLoadingSpinner(false);
    }
  };

  const baseBgColor = isImageConverterType ? 'bg-gray-800' : 'bg-gray-900';
  const cardBgColor = isImageConverterType ? 'bg-gray-700' : 'bg-gray-800';
  const cardBorderColor = isImageConverterType ? 'border-gray-600' : 'border-gray-700';
  
  const dropzoneIconSVG = isImageConverterType ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan-text mx-auto text-purple-500 mb-4 animate-float"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/><path d="M12 17v-5"/></svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-digit mx-auto text-purple-500 mb-4 animate-float"><line x1="9" x2="9" y1="12" y2="18"/><line x1="15" x2="15" y1="6" y2="18"/><path d="M12 12a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4Z"/><path d="M4 22h16a2 2 0 0 0 2-2V8L14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z"/><path d="M14 2v6h6"/></svg>
  );

  return (
    <section id={id} className={`py-20 ${baseBgColor}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-100" id={`${id}-title`}>{t(sectionTitleKey)}</h2>
        <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto" id={`${id}-subtitle`}>{t(sectionSubtitleKey)}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {featuresData.map((feature, index) => (
            <FeatureCard
              key={index}
              iconSVG={feature.iconSVG}
              titleKey={feature.titleKey}
              descriptionKey={feature.descriptionKey}
              bgColor={cardBgColor}
              borderColor={cardBorderColor}
              idPrefix={id} 
              featureIndex={index + 1} 
            />
          ))}
        </div>

        <Dropzone
          id={dropzoneId}
          iconSVG={dropzoneIconSVG}
          textId={`${id}-dropzone-text`} 
          subtextId={`${id}-dropzone-subtext`} 
          selectedFileId={selectedFileId} 
          onFileSelected={handleFileSelect}
          fileNameDisplay={fileNameDisplay} 
        />
        
        {showConversionArea && conversionStatus !== 'success' && ( // Hide main convert button on success
            <div id={conversionAreaId} className="mt-12 flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-10">
                <button 
                    id={convertBtnId} 
                    onClick={handleConvertClick}
                    disabled={isConvertButtonDisabled || conversionStatus === 'noFile'}
                    className="btn bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-10 py-4 rounded-lg text-xl font-semibold hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 shadow-lg flex items-center justify-center transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {showLoadingSpinner && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 animate-spin mr-3 w-6 h-6" id={loadingSpinnerId}></svg>
                    )}
                    <span id={`${convertBtnId}-text`}>{convertButtonText}</span>
                </button>
            </div>
        )}

        {showProgressBar && conversionStatus !== 'success' && ( // Also hide progress bar on success (buttons take over)
            <div id={progressBarContainerId} className="w-full max-w-xl mx-auto mt-12 bg-gray-700 rounded-full h-3 overflow-hidden">
                <div id={progressBarId} className="bg-purple-500 h-full rounded-full transition-all duration-300 ease-in-out" style={{ width: `${progress}%` }}></div>
            </div>
        )}
        
        <p id={statusMessageId} className="text-center mt-6 text-xl font-medium"></p>

        {conversionStatus === 'success' && (
          <div id={`${id}-success-actions`} className="mt-10 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
            <button
              id={`${id}-convert-another-btn`}
              onClick={handleConvertAnother}
              className="btn bg-gray-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-gray-700 transition-all duration-300"
            >
              {t('convertAnotherFileBtn')}
            </button>
            <button
              id={`${id}-preview-edit-btn`}
              onClick={handlePreviewOrEdit}
              className="btn bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-all duration-300"
            >
              {t('previewOrEditBtn')}
            </button>
            <button
              id={`${id}-download-success-btn`}
              onClick={handleDownloadSuccessFile}
              disabled={!docxDownloadUrl}
              className="btn bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('downloadConvertedFileInSectionBtn')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ConverterSection;
