
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Timer } from 'lucide-react';

interface ServiceTimeConfigProps {
  serviceTime: number;
  timeWindow?: {
    start: string;
    end: string;
  };
  onServiceTimeChange: (time: number) => void;
  onTimeWindowChange: (timeWindow: { start: string; end: string } | undefined) => void;
  addressIndex: number;
}

const ServiceTimeConfig: React.FC<ServiceTimeConfigProps> = ({
  serviceTime,
  timeWindow,
  onServiceTimeChange,
  onTimeWindowChange,
  addressIndex
}) => {
  return (
    <div className="flex gap-2 mt-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Timer className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <Label htmlFor={`service-${addressIndex}`} className="text-xs">Service Time (min)</Label>
          <Input
            id={`service-${addressIndex}`}
            type="number"
            min="0"
            max="480"
            value={serviceTime}
            onChange={(e) => onServiceTimeChange(Number(e.target.value))}
            className="h-8 text-xs"
            placeholder="15"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <Label className="text-xs">Time Window (optional)</Label>
          <div className="flex gap-1">
            <Input
              type="time"
              value={timeWindow?.start || ''}
              onChange={(e) => {
                if (e.target.value) {
                  onTimeWindowChange({
                    start: e.target.value,
                    end: timeWindow?.end || '17:00'
                  });
                } else {
                  onTimeWindowChange(undefined);
                }
              }}
              className="h-8 text-xs"
              placeholder="Start"
            />
            <Input
              type="time"
              value={timeWindow?.end || ''}
              onChange={(e) => {
                if (e.target.value && timeWindow) {
                  onTimeWindowChange({
                    start: timeWindow.start,
                    end: e.target.value
                  });
                }
              }}
              className="h-8 text-xs"
              placeholder="End"
              disabled={!timeWindow?.start}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTimeConfig;
