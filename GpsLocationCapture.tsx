import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface GpsCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface GpsLocationCaptureProps {
  value?: GpsCoords;
  onChange: (coords?: GpsCoords) => void;
  required?: boolean;
}

const GpsLocationCapture: React.FC<GpsLocationCaptureProps> = ({
  value,
  onChange,
  required = false
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser or device.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy)
        });
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMessage('Location permission denied. Please allow location access in your browser or device settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMessage('Location information is unavailable. Try outdoors or enter coordinates manually.');
            break;
          case error.TIMEOUT:
            setErrorMessage('Location request timed out. Please try again.');
            break;
          default:
            setErrorMessage('An unknown error occurred while retrieving location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#f0f6fc] flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5 text-[#2ea043] mr-1" />
          <span>GPS Coordinates (Learning Center Physical Location)</span>
          {required && <span className="text-red-400">*</span>}
        </label>
        {value && (
          <span className="text-[11px] text-[#2ea043] bg-[#238636]/15 border border-[#238636]/30 px-2 py-0.5 rounded-md font-mono flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            GPS Locked (±{value.accuracy || 10}m)
          </span>
        )}
      </div>

      <p className="text-[11px] text-[#8b949e]">
        Capture supervisor on-site GPS verification to confirm physical visit at the learning center.
      </p>

      {value ? (
        <div className="p-3.5 bg-[#0d1117] border border-[#238636]/40 rounded-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#238636]/20 border border-[#238636]/40 text-[#2ea043] flex items-center justify-center font-bold text-[10px] font-mono">
                GPS
              </div>
              <div>
                <p className="text-xs font-bold text-[#f0f6fc] font-mono">
                  {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                </p>
                <p className="text-[10px] text-[#8b949e]">
                  Accuracy: ±{value.accuracy ? `${value.accuracy} meters` : 'High precision'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-[#161b22] text-[#2ea043] border border-[#238636]/40 hover:bg-[#21262d] px-2.5 py-1.5 rounded-lg font-medium flex items-center space-x-1 transition-colors"
              >
                <span>View on Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                className="text-xs bg-[#161b22] text-[#c9d1d9] border border-[#30363d] hover:bg-[#21262d] hover:text-[#f0f6fc] px-2.5 py-1.5 rounded-lg font-medium flex items-center space-x-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 text-[#58a6ff] ${loading ? 'animate-spin' : ''}`} />
                <span>Re-detect</span>
              </button>
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#238636]/15 border border-[#238636]/30 hover:bg-[#238636]/25 text-[#2ea043] rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#2ea043] border-t-transparent rounded-full animate-spin" />
                <span>Detecting GPS Location via Satellites...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-[#2ea043]" />
                <span>Tap to Record Current GPS Location</span>
              </>
            )}
          </button>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">GPS Detection Issue</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GpsLocationCapture;
