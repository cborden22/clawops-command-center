
import { WizardQuestion, WizardResult, DeviceClassification } from '@/types/compliance';

export const wizardQuestions: WizardQuestion[] = [
  {
    id: 'merchandise_only',
    question: 'Does the device award merchandise only (not cash or cash-equivalents)?',
    type: 'yes_no'
  },
  {
    id: 'skill_predominant',
    question: 'Is skill (timing/aim) the predominant factor in winning?',
    type: 'yes_no'
  },
  {
    id: 'visible_prizes',
    question: 'Are prizes visible and obtainable with skill (no blind boxes dispensing at random)?',
    type: 'yes_no'
  },
  {
    id: 'prize_value',
    question: 'Is any single prize value over $25?',
    type: 'yes_no'
  },
  {
    id: 'tokens_merchandise',
    question: 'Are tokens/tickets redeemable for merchandise only (no cash)?',
    type: 'yes_no'
  },
  {
    id: 'alcohol_venue',
    question: 'Does the location serve alcohol?',
    type: 'yes_no'
  },
  {
    id: 'coin_pusher',
    question: 'Is this device a coin pusher/8-liner/slot look-alike?',
    type: 'yes_no'
  },
  {
    id: 'random_element',
    question: 'Does the device have significant random elements that affect winning?',
    type: 'yes_no'
  }
];

export const classifyDevice = (answers: Record<string, string>): WizardResult => {
  const riskFlags: string[] = [];
  const requirements: string[] = [];
  let classification = 'Unknown Device Type';

  // Basic classification logic
  if (answers.merchandise_only === 'yes' && answers.skill_predominant === 'yes' && answers.visible_prizes === 'yes') {
    classification = 'Likely Amusement Skill Device';
  } else if (answers.coin_pusher === 'yes' || answers.random_element === 'yes') {
    classification = 'Possible Gambling Device';
    riskFlags.push('High enforcement risk - may be classified as gambling');
  } else if (answers.merchandise_only === 'no') {
    classification = 'Prohibited Device';
    riskFlags.push('Cash or cash-equivalent prizes prohibited in most jurisdictions');
  } else {
    classification = 'Mixed Classification - Requires Review';
    riskFlags.push('Classification unclear - consult regulator');
  }

  // Prize value warnings
  if (answers.prize_value === 'yes') {
    riskFlags.push('Prize value exceeds common state caps; reduce to $25 or less');
  }

  // Token/ticket issues
  if (answers.tokens_merchandise === 'no') {
    riskFlags.push('Cash-redeemable tokens may be prohibited');
  }

  // Alcohol venue considerations
  if (answers.alcohol_venue === 'yes') {
    requirements.push('Age restrictions may apply (18+ or 21+)');
    requirements.push('Additional placement restrictions in alcohol venues');
  }

  // General requirements for skill devices
  if (classification === 'Likely Amusement Skill Device') {
    requirements.push('State or local amusement permit may be required');
    requirements.push('Sales tax on plays typically applies');
    requirements.push('Required signage: "No cash prizes", "Skill disclosure"');
    requirements.push('Machine marking with owner/operator info');
  }

  return {
    classification,
    risk_flags: riskFlags,
    requirements,
    sources: [
      { title: 'State Gaming/Revenue Department', url: '#' },
      { title: 'Local Business License Office', url: '#' }
    ]
  };
};

export const deviceClassifier: DeviceClassification = {
  questions: wizardQuestions,
  logic: classifyDevice
};
