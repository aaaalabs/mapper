export const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Alexander', 'Amelia',
  'Michael', 'Harper', 'Benjamin', 'Evelyn', 'Daniel'
];

export const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

export const roles = [
  'Software Engineer', 'Product Manager', 'UX Designer', 'Data Scientist',
  'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Technical Lead', 'Engineering Manager', 'UI Designer', 'System Architect',
  'Cloud Engineer', 'Machine Learning Engineer', 'Mobile Developer'
];

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateUsername(firstName: string, lastName: string): string {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}${cleanLast}${Math.floor(Math.random() * 100)}`;
}

export function generateAvatarUrl(name: string): string {
  const styles = ['Circle', 'Transparent'];
  const topTypes = ['NoHair', 'Eyepatch', 'Hat', 'Hijab', 'Turban', 'WinterHat1', 'WinterHat2', 'WinterHat3', 'WinterHat4', 'LongHairBigHair', 'LongHairBob', 'LongHairBun', 'LongHairCurly', 'LongHairCurvy', 'LongHairDreads', 'LongHairFrida', 'LongHairFro', 'LongHairFroBand', 'LongHairNotTooLong', 'LongHairShavedSides', 'LongHairMiaWallace', 'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand', 'ShortHairDreads01', 'ShortHairDreads02', 'ShortHairFrizzle', 'ShortHairShaggyMullet', 'ShortHairShortCurly', 'ShortHairShortFlat', 'ShortHairShortRound', 'ShortHairShortWaved', 'ShortHairSides', 'ShortHairTheCaesar', 'ShortHairTheCaesarSidePart'];
  
  const params = new URLSearchParams({
    avatarStyle: getRandomElement(styles),
    topType: getRandomElement(topTypes),
    accessoriesType: getRandomElement(['Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Sunglasses', 'Wayfarers']),
    hairColor: getRandomElement(['Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'PastelPink', 'Platinum', 'Red', 'SilverGray']),
    facialHairType: getRandomElement(['Blank', 'BeardMedium', 'BeardLight', 'BeardMajestic', 'MoustacheFancy', 'MoustacheMagnum']),
    clotheType: getRandomElement(['BlazerShirt', 'BlazerSweater', 'CollarSweater', 'GraphicShirt', 'Hoodie', 'Overall', 'ShirtCrewNeck', 'ShirtScoopNeck', 'ShirtVNeck']),
    clotheColor: getRandomElement(['Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue', 'PastelGreen', 'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White']),
    eyeType: getRandomElement(['Close', 'Cry', 'Default', 'Dizzy', 'EyeRoll', 'Happy', 'Hearts', 'Side', 'Squint', 'Surprised', 'Wink', 'WinkWacky']),
    eyebrowType: getRandomElement(['Angry', 'AngryNatural', 'Default', 'DefaultNatural', 'FlatNatural', 'RaisedExcited', 'RaisedExcitedNatural', 'SadConcerned', 'SadConcernedNatural', 'UnibrowNatural', 'UpDown', 'UpDownNatural']),
    mouthType: getRandomElement(['Concerned', 'Default', 'Disbelief', 'Eating', 'Grimace', 'Sad', 'ScreamOpen', 'Serious', 'Smile', 'Tongue', 'Twinkle', 'Vomit']),
    skinColor: getRandomElement(['Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black'])
  });

  return `https://avataaars.io/?${params.toString()}`;
}

export function generateWebsite(username: string): string {
  const domain = getRandomElement(['dev', 'tech', 'io', 'me', 'codes', 'app']);
  return `https://${username}.${domain}`;
}

export function generateLinkedIn(username: string): string {
  return `https://linkedin.com/in/${username}`;
}