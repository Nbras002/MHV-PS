import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QrScanner from 'qr-scanner';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { X, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [error, setError] = useState<string>('');
  
  // Lock scroll when scanner is open
  useModalScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          onScan(result.data);
          onClose();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScanner.start().catch((err) => {
        setError(t('common.cameraAccessDenied'));
        console.error('QR Scanner error:', err);
      });

      setScanner(qrScanner);

      return () => {
        qrScanner.stop();
        qrScanner.destroy();
      };
    }
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 modal-container">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 my-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            {t('common.scanQRCode')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover rounded-lg"
              playsInline
            />
            <div className="absolute inset-0 border-2 border-purple-600 rounded-lg pointer-events-none">
              <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-purple-600"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-purple-600"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-purple-600"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-purple-600"></div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mt-4 text-center">
          {t('common.positionQRCode')}
        </p>
      </div>
    </div>
  );
};

export default QRScanner;