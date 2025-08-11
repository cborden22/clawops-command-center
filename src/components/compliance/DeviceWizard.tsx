
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { deviceClassifier } from '@/utils/deviceClassifier';
import { WizardResult } from '@/types/compliance';

interface DeviceWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceWizard: React.FC<DeviceWizardProps> = ({ isOpen, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<WizardResult | null>(null);

  const questions = deviceClassifier.questions;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    const questionId = questions[currentQuestion].id;
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered, generate result
      const wizardResult = deviceClassifier.logic(newAnswers);
      setResult(wizardResult);
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const resetWizard = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  const getClassificationColor = (classification: string) => {
    if (classification.includes('Likely Amusement')) return 'bg-green-500';
    if (classification.includes('Possible Gambling')) return 'bg-red-500';
    if (classification.includes('Prohibited')) return 'bg-red-600';
    return 'bg-yellow-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎯 Device Classifier Wizard
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} />
            </div>

            {/* Current Question */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {questions[currentQuestion].question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleAnswer('yes')}
                    variant="outline"
                    className="h-20 text-lg"
                  >
                    <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
                    Yes
                  </Button>
                  <Button
                    onClick={() => handleAnswer('no')}
                    variant="outline"
                    className="h-20 text-lg"
                  >
                    <XCircle className="h-6 w-6 mr-2 text-red-500" />
                    No
                  </Button>
                </div>

                {currentQuestion > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={goBack}
                    className="w-full"
                  >
                    ← Go Back
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Previous Answers */}
            {Object.keys(answers).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Your Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {Object.entries(answers).map(([questionId, answer]) => {
                      const question = questions.find(q => q.id === questionId);
                      return (
                        <div key={questionId} className="flex justify-between">
                          <span className="truncate pr-2">{question?.question}</span>
                          <Badge variant={answer === 'yes' ? 'default' : 'secondary'}>
                            {answer}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Results */
          <div className="space-y-4">
            {/* Classification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Classification Result</span>
                  <Badge className={`${getClassificationColor(result.classification)} text-white`}>
                    {result.classification}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Risk Flags */}
            {result.risk_flags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.risk_flags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span className="text-sm">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {result.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Recommended Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:underline text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {source.title}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={resetWizard} variant="outline" className="flex-1">
                Start Over
              </Button>
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
