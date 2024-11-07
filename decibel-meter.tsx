import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

const DecibelMeter = () => {
  const [isListening, setIsListening] = useState(false);
  const [decibels, setDecibels] = useState(0);
  const [peakDecibels, setPeakDecibels] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  const startListening = async () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = context.createMediaStreamSource(stream);
      const analyzer = context.createAnalyser();
      
      analyzer.fftSize = 1024;
      analyzer.smoothingTimeConstant = 0.8;
      source.connect(analyzer);

      setAudioContext(context);
      setIsListening(true);
      setErrorMessage('');

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      const updateDecibels = () => {
        if (!isListening) return;
        
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
        const normalizedDecibels = Math.round((average / 255) * 100);
        
        setDecibels(normalizedDecibels);
        setPeakDecibels(prev => Math.max(prev, normalizedDecibels));
        
        requestAnimationFrame(updateDecibels);
      };
      
      updateDecibels();
    } catch (error) {
      setErrorMessage('Please allow microphone access to use the decibel meter.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setIsListening(false);
  };

  const getDecibelColor = (level) => {
    if (level < 30) return 'text-green-500';
    if (level < 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGaugeRotation = (level) => {
    // Convert level (0-100) to degrees (-90 to 90)
    return (level / 100) * 180 - 90;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Decibel Meter</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Gauge Display */}
        <div className="relative w-64 h-32 mx-auto mb-8">
          {/* Gauge Background */}
          <div className="absolute w-full h-full border-t-8 border-gray-200 rounded-t-full" />
          
          {/* Gauge Needle */}
          <div 
            className="absolute w-1 h-24 bg-blue-600 origin-bottom rounded"
            style={{
              left: '50%',
              bottom: '0',
              transform: `translateX(-50%) rotate(${getGaugeRotation(decibels)}deg)`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.1s ease-out'
            }}
          />
          
          {/* Gauge Center Point */}
          <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-blue-600 rounded-full transform -translate-x-1/2" />
        </div>

        {/* Current and Peak Readings */}
        <div className="space-y-4 text-center mb-6">
          <div>
            <p className="text-sm text-gray-500">Current Level</p>
            <p className={`text-4xl font-bold ${getDecibelColor(decibels)}`}>
              {decibels}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Peak Level</p>
            <p className={`text-2xl font-bold ${getDecibelColor(peakDecibels)}`}>
              {peakDecibels}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={isListening ? stopListening : startListening}
            className={isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
          >
            {isListening ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start
              </>
            )}
          </Button>
          {peakDecibels > 0 && (
            <Button
              variant="outline"
              onClick={() => setPeakDecibels(0)}
            >
              Reset Peak
            </Button>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <p className="text-red-500 text-center mt-4 text-sm">
            {errorMessage}
          </p>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-6">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            <span className="text-sm">Low</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
            <span className="text-sm">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
            <span className="text-sm">High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DecibelMeter;
