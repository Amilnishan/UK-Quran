
/*
 * Level 3 Arabic connected-letter lesson/game data.
 * Keep the existing object shape so level3.html and game-level-3.html
 * can continue consuming this file without changes.
 * Word endings use ordinary harakat/sukoon, not tanween.
 */
window.Level3Letters = [
  { name: 'Alif',  ar: 'أ', display: 'أَ', forms: ['أَسَدُ', 'سَأَلَ', 'قَرَأَ'], gameWord: 'أَكَلَ' },
  { name: 'Ba',    ar: 'ب', display: 'بَ', forms: ['بَيْتُ', 'كَبِيرُ', 'لَعِبَ'], gameWord: 'بَابُ' },
  { name: 'Ta',    ar: 'ت', display: 'تَ', forms: ['تَمْرُ', 'فَتَحَ', 'بِنْتُ'], gameWord: 'تَمْرُ' },
  { name: 'Tha',   ar: 'ث', display: 'ثَ', forms: ['ثَوْبُ', 'مَثَلُ', 'حَدِيثُ'], gameWord: 'ثَوْبُ' },
  { name: 'Jeem',  ar: 'ج', display: 'جَ', forms: ['جَمَلُ', 'شَجَرَةُ', 'ثَلْجُ'], gameWord: 'جَمَلُ' },
  { name: 'Haa',   ar: 'ح', display: 'حَ', forms: ['حُوتُ', 'بَحْرُ', 'سَبَحَ'], gameWord: 'حُوتُ' },
  { name: 'Khaa',  ar: 'خ', display: 'خَ', forms: ['خُبْزُ', 'يَخْرُجُ', 'شَيْخُ'], gameWord: 'خُبْزُ' },
  { name: 'Dal',   ar: 'د', display: 'دَ', forms: ['دَارُ', 'مَدْرَسَةُ', 'وَلَدُ'], gameWord: 'دَارُ' },
  { name: 'Thal',  ar: 'ذ', display: 'ذَ', forms: ['ذَهَبُ', 'مَذْهَبُ', 'أَخَذَ'], gameWord: 'ذَهَبُ' },
  { name: 'Ra',    ar: 'ر', display: 'رَ', forms: ['رَجُلُ', 'مَرَضُ', 'قَمَرُ'], gameWord: 'رَجُلُ' },
  { name: 'Zay',   ar: 'ز', display: 'زَ', forms: ['زَهْرَةُ', 'مَزْرَعَةُ', 'رَمَزَ'], gameWord: 'مَوْزُ' },
  { name: 'Seen',  ar: 'س', display: 'سَ', forms: ['سَمَكُ', 'مَسْجِدُ', 'شَمْسُ'], gameWord: 'سَمَكُ' },
  { name: 'Sheen', ar: 'ش', display: 'شَ', forms: ['شَمْسُ', 'مَشْرُوبُ', 'جَيْشُ'], gameWord: 'شَمْسُ' },
  { name: 'Saad',  ar: 'ص', display: 'صَ', forms: ['صَبْرُ', 'مَصْدَرُ', 'قِصَصُ'], gameWord: 'صَبْرُ' },
  { name: 'Dad',   ar: 'ض', display: 'ضَ', forms: ['ضَيْفُ', 'مَضْرِبُ', 'بَيْضُ'], gameWord: 'ضَيْفُ' },
  { name: 'Taa',   ar: 'ط', display: 'طَ', forms: ['طَعَامُ', 'مَطَرُ', 'خَيْطُ'], gameWord: 'طَعَامُ' },
  { name: 'Dhaa',  ar: 'ظ', display: 'ظَ', forms: ['ظَرْفُ', 'مَنْظَرُ', 'حِفْظُ'], gameWord: 'ظَرْفُ' },
  { name: 'Ain',   ar: 'ع', display: 'عَ', forms: ['عَيْنُ', 'مُعَلِّمُ', 'سَمِعَ'], gameWord: 'مَعَكَ' },
  { name: 'Ghain', ar: 'غ', display: 'غَ', forms: ['غُرْفَةُ', 'صَغِيرُ', 'بَلَغَ'], gameWord: 'غُرْفَةُ' },
  { name: 'Fa',    ar: 'ف', display: 'فَ', forms: ['فَمُ', 'مَفْتَاحُ', 'كَتِفُ'], gameWord: 'فَمُ' },
  { name: 'Qaf',   ar: 'ق', display: 'قَ', forms: ['قَلَمُ', 'بَقَرَةُ', 'طَرِيقُ'], gameWord: 'قَلَمُ' },
  { name: 'Kaf',   ar: 'ك', display: 'كَ', forms: ['كَلْبُ', 'مَكْتَبُ', 'مَلَكُ'], gameWord: 'مَكْتَبُ' },
  { name: 'Lam',   ar: 'ل', display: 'لَ', forms: ['لَبَنُ', 'قَلَمُ', 'جَمَلُ'], gameWord: 'قَلَمُ' },
  { name: 'Meem',  ar: 'م', display: 'مَ', forms: ['مَدْرَسَةُ', 'سَمَكُ', 'عَلَمُ'], gameWord: 'سَمَكُ' },
  { name: 'Nun',   ar: 'ن', display: 'نَ', forms: ['نَجْمُ', 'جَنَّةُ', 'حَزِينُ'], gameWord: 'نَارُ' },
  { name: 'Ha',    ar: 'ه', display: 'هَ', forms: ['هَوَاءُ', 'مَهْدُ', 'وَجْهُ'], gameWord: 'هَوَاءُ' },
  { name: 'Waw',   ar: 'و', display: 'وَ', forms: ['وَرَقُ', 'نَوْمُ', 'دَلْوُ'], gameWord: 'نَوْمُ' },
  { name: 'Ya',    ar: 'ي', display: 'يَ', forms: ['يَدُ', 'بَيْتُ', 'كُرْسِيّ'], gameWord: 'بَيْتُ' }
];

