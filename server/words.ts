interface WordWithMetadata {
  name: string;
  type?: string;
  color?: string;
  size?: string;
  habitat?: string;
  category?: string;
}

const fruitsVegetablesWithMetadata: WordWithMetadata[] = [
  { name: "تفاح", type: "فاكهة", color: "أحمر", size: "متوسط" },
  { name: "تفاح أخضر", type: "فاكهة", color: "أخضر", size: "متوسط" },
  { name: "برتقال", type: "فاكهة", color: "برتقالي", size: "متوسط" },
  { name: "يوسفي", type: "فاكهة", color: "برتقالي", size: "صغير" },
  { name: "جريب فروت", type: "فاكهة", color: "برتقالي", size: "كبير" },
  { name: "ليمون", type: "فاكهة", color: "أصفر", size: "صغير" },
  { name: "موز", type: "فاكهة", color: "أصفر", size: "متوسط" },
  { name: "عنب", type: "فاكهة", color: "بنفسجي", size: "صغير" },
  { name: "عنب أخضر", type: "فاكهة", color: "أخضر", size: "صغير" },
  { name: "فراولة", type: "فاكهة", color: "أحمر", size: "صغير" },
  { name: "توت", type: "فاكهة", color: "بنفسجي", size: "صغير" },
  { name: "توت أزرق", type: "فاكهة", color: "أزرق", size: "صغير" },
  { name: "مانجو", type: "فاكهة", color: "برتقالي", size: "متوسط" },
  { name: "أناناس", type: "فاكهة", color: "أصفر", size: "كبير" },
  { name: "بطيخ", type: "فاكهة", color: "أحمر", size: "كبير" },
  { name: "شمام", type: "فاكهة", color: "برتقالي", size: "كبير" },
  { name: "خوخ", type: "فاكهة", color: "برتقالي", size: "متوسط" },
  { name: "مشمش", type: "فاكهة", color: "برتقالي", size: "صغير" },
  { name: "كمثرى", type: "فاكهة", color: "أخضر", size: "متوسط" },
  { name: "كيوي", type: "فاكهة", color: "أخضر", size: "صغير" },
  { name: "رمان", type: "فاكهة", color: "أحمر", size: "متوسط" },
  { name: "تين", type: "فاكهة", color: "بنفسجي", size: "صغير" },
  { name: "تمر", type: "فاكهة", color: "بني", size: "صغير" },
  { name: "كرز", type: "فاكهة", color: "أحمر", size: "صغير" },
  { name: "أفوكادو", type: "فاكهة", color: "أخضر", size: "متوسط" },
  { name: "جوز الهند", type: "فاكهة", color: "بني", size: "كبير" },
  { name: "بابايا", type: "فاكهة", color: "برتقالي", size: "كبير" },
  { name: "جوافة", type: "فاكهة", color: "أخضر", size: "متوسط" },
  { name: "باشن فروت", type: "فاكهة", color: "بنفسجي", size: "صغير" },
  { name: "ليتشي", type: "فاكهة", color: "أحمر", size: "صغير" },
  { name: "دراجون فروت", type: "فاكهة", color: "وردي", size: "متوسط" },
  { name: "نكتارين", type: "فاكهة", color: "برتقالي", size: "متوسط" },
  { name: "برقوق", type: "فاكهة", color: "بنفسجي", size: "صغير" },
  { name: "كاكي", type: "فاكهة", color: "برتقالي", size: "متوسط" },
  { name: "طماطم", type: "خضروات", color: "أحمر", size: "متوسط" },
  { name: "خيار", type: "خضروات", color: "أخضر", size: "متوسط" },
  { name: "جزر", type: "خضروات", color: "برتقالي", size: "متوسط" },
  { name: "بطاطس", type: "خضروات", color: "بني", size: "متوسط" },
  { name: "بطاطا حلوة", type: "خضروات", color: "برتقالي", size: "متوسط" },
  { name: "بصل", type: "خضروات", color: "بني", size: "متوسط" },
  { name: "بصل أخضر", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "ثوم", type: "خضروات", color: "أبيض", size: "صغير" },
  { name: "فلفل أخضر", type: "خضروات", color: "أخضر", size: "متوسط" },
  { name: "فلفل أحمر", type: "خضروات", color: "أحمر", size: "متوسط" },
  { name: "فلفل أصفر", type: "خضروات", color: "أصفر", size: "متوسط" },
  { name: "فلفل حار", type: "خضروات", color: "أحمر", size: "صغير" },
  { name: "باذنجان", type: "خضروات", color: "بنفسجي", size: "متوسط" },
  { name: "كوسا", type: "خضروات", color: "أخضر", size: "متوسط" },
  { name: "بامية", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "ملفوف", type: "خضروات", color: "أخضر", size: "كبير" },
  { name: "ملفوف أحمر", type: "خضروات", color: "بنفسجي", size: "كبير" },
  { name: "خس", type: "خضروات", color: "أخضر", size: "متوسط" },
  { name: "سبانخ", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "بروكلي", type: "خضروات", color: "أخضر", size: "متوسط" },
  { name: "قرنبيط", type: "خضروات", color: "أبيض", size: "كبير" },
  { name: "فاصوليا خضراء", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "بازلاء", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "ذرة", type: "خضروات", color: "أصفر", size: "متوسط" },
  { name: "فجل", type: "خضروات", color: "أحمر", size: "صغير" },
  { name: "شمندر", type: "خضروات", color: "بنفسجي", size: "متوسط" },
  { name: "بقدونس", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "كزبرة", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "نعناع", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "ريحان", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "زنجبيل", type: "خضروات", color: "بني", size: "صغير" },
  { name: "كرفس", type: "خضروات", color: "أخضر", size: "متوسط" },
  { name: "جرجير", type: "خضروات", color: "أخضر", size: "صغير" },
  { name: "فطر", type: "خضروات", color: "بني", size: "صغير" },
  { name: "يقطين", type: "خضروات", color: "برتقالي", size: "كبير" },
  { name: "قرع", type: "خضروات", color: "أخضر", size: "كبير" },
  { name: "لفت", type: "خضروات", color: "أبيض", size: "متوسط" },
  { name: "خرشوف", type: "خضروات", color: "أخضر", size: "متوسط" },
  { name: "هليون", type: "خضروات", color: "أخضر", size: "متوسط" },
];

const animalsWithMetadata: WordWithMetadata[] = [
  { name: "أسد", category: "ثدييات", habitat: "سافانا", size: "كبير" },
  { name: "نمر", category: "ثدييات", habitat: "غابة", size: "كبير" },
  { name: "فهد", category: "ثدييات", habitat: "سافانا", size: "كبير" },
  { name: "نمر مرقط", category: "ثدييات", habitat: "غابة", size: "كبير" },
  { name: "ذئب", category: "ثدييات", habitat: "غابة", size: "متوسط" },
  { name: "ثعلب", category: "ثدييات", habitat: "غابة", size: "متوسط" },
  { name: "ثعلب قطبي", category: "ثدييات", habitat: "قطبي", size: "صغير" },
  { name: "دب", category: "ثدييات", habitat: "غابة", size: "كبير" },
  { name: "دب قطبي", category: "ثدييات", habitat: "قطبي", size: "كبير" },
  { name: "باندا", category: "ثدييات", habitat: "غابة", size: "كبير" },
  { name: "فيل", category: "ثدييات", habitat: "سافانا", size: "ضخم" },
  { name: "فيل آسيوي", category: "ثدييات", habitat: "غابة", size: "ضخم" },
  { name: "زرافة", category: "ثدييات", habitat: "سافانا", size: "ضخم" },
  { name: "وحيد القرن", category: "ثدييات", habitat: "سافانا", size: "ضخم" },
  { name: "فرس النهر", category: "ثدييات", habitat: "مائي", size: "ضخم" },
  { name: "غزال", category: "ثدييات", habitat: "سافانا", size: "متوسط" },
  { name: "ظبي", category: "ثدييات", habitat: "سافانا", size: "متوسط" },
  { name: "أيل", category: "ثدييات", habitat: "غابة", size: "كبير" },
  { name: "موظ", category: "ثدييات", habitat: "غابة", size: "كبير" },
  { name: "حصان", category: "ثدييات", habitat: "مزرعة", size: "كبير" },
  { name: "حمار", category: "ثدييات", habitat: "مزرعة", size: "متوسط" },
  { name: "حمار وحشي", category: "ثدييات", habitat: "سافانا", size: "متوسط" },
  { name: "بقرة", category: "ثدييات", habitat: "مزرعة", size: "كبير" },
  { name: "ثور", category: "ثدييات", habitat: "مزرعة", size: "كبير" },
  { name: "جاموس", category: "ثدييات", habitat: "سافانا", size: "كبير" },
  { name: "جمل", category: "ثدييات", habitat: "صحراء", size: "كبير" },
  { name: "لاما", category: "ثدييات", habitat: "جبال", size: "متوسط" },
  { name: "خروف", category: "ثدييات", habitat: "مزرعة", size: "متوسط" },
  { name: "ماعز", category: "ثدييات", habitat: "مزرعة", size: "متوسط" },
  { name: "خنزير", category: "ثدييات", habitat: "مزرعة", size: "متوسط" },
  { name: "خنزير بري", category: "ثدييات", habitat: "غابة", size: "متوسط" },
  { name: "قط", category: "ثدييات", habitat: "منزل", size: "صغير" },
  { name: "كلب", category: "ثدييات", habitat: "منزل", size: "متوسط" },
  { name: "أرنب", category: "ثدييات", habitat: "منزل", size: "صغير" },
  { name: "سنجاب", category: "ثدييات", habitat: "غابة", size: "صغير" },
  { name: "قندس", category: "ثدييات", habitat: "مائي", size: "متوسط" },
  { name: "قنفذ", category: "ثدييات", habitat: "غابة", size: "صغير" },
  { name: "فأر", category: "ثدييات", habitat: "منزل", size: "صغير" },
  { name: "هامستر", category: "ثدييات", habitat: "منزل", size: "صغير" },
  { name: "خلد", category: "ثدييات", habitat: "تحت الأرض", size: "صغير" },
  { name: "قرد", category: "ثدييات", habitat: "غابة", size: "متوسط" },
  { name: "شمبانزي", category: "ثدييات", habitat: "غابة", size: "متوسط" },
  { name: "غوريلا", category: "ثدييات", habitat: "غابة", size: "كبير" },
  { name: "إنسان الغاب", category: "ثدييات", habitat: "غابة", size: "كبير" },
  { name: "كنغر", category: "ثدييات", habitat: "سافانا", size: "كبير" },
  { name: "كوالا", category: "ثدييات", habitat: "غابة", size: "صغير" },
  { name: "خفاش", category: "ثدييات", habitat: "كهف", size: "صغير" },
  { name: "دولفين", category: "ثدييات", habitat: "بحر", size: "كبير" },
  { name: "حوت", category: "ثدييات", habitat: "بحر", size: "ضخم" },
  { name: "حوت أزرق", category: "ثدييات", habitat: "بحر", size: "ضخم" },
  { name: "حوت قاتل", category: "ثدييات", habitat: "بحر", size: "كبير" },
  { name: "فقمة", category: "ثدييات", habitat: "بحر", size: "متوسط" },
  { name: "أسد البحر", category: "ثدييات", habitat: "بحر", size: "كبير" },
  { name: "فظ", category: "ثدييات", habitat: "قطبي", size: "كبير" },
  { name: "قرش", category: "سمك", habitat: "بحر", size: "كبير" },
  { name: "سمكة", category: "سمك", habitat: "بحر", size: "صغير" },
  { name: "سلمون", category: "سمك", habitat: "نهر", size: "متوسط" },
  { name: "تونة", category: "سمك", habitat: "بحر", size: "كبير" },
  { name: "سردين", category: "سمك", habitat: "بحر", size: "صغير" },
  { name: "سلحفاة", category: "زواحف", habitat: "بحر", size: "متوسط" },
  { name: "سلحفاة برية", category: "زواحف", habitat: "صحراء", size: "صغير" },
  { name: "تمساح", category: "زواحف", habitat: "مائي", size: "كبير" },
  { name: "تمساح نيلي", category: "زواحف", habitat: "نهر", size: "كبير" },
  { name: "ثعبان", category: "زواحف", habitat: "غابة", size: "متوسط" },
  { name: "أفعى", category: "زواحف", habitat: "صحراء", size: "متوسط" },
  { name: "كوبرا", category: "زواحف", habitat: "غابة", size: "كبير" },
  { name: "حرباء", category: "زواحف", habitat: "غابة", size: "صغير" },
  { name: "سحلية", category: "زواحف", habitat: "صحراء", size: "صغير" },
  { name: "إغوانا", category: "زواحف", habitat: "غابة", size: "متوسط" },
  { name: "ضفدع", category: "برمائيات", habitat: "مائي", size: "صغير" },
  { name: "علجوم", category: "برمائيات", habitat: "مائي", size: "صغير" },
  { name: "سمندل", category: "برمائيات", habitat: "مائي", size: "صغير" },
  { name: "نسر", category: "طيور", habitat: "جبال", size: "كبير" },
  { name: "صقر", category: "طيور", habitat: "صحراء", size: "متوسط" },
  { name: "بومة", category: "طيور", habitat: "غابة", size: "متوسط" },
  { name: "ببغاء", category: "طيور", habitat: "غابة", size: "متوسط" },
  { name: "طاووس", category: "طيور", habitat: "غابة", size: "كبير" },
  { name: "بطة", category: "طيور", habitat: "مائي", size: "متوسط" },
  { name: "إوزة", category: "طيور", habitat: "مائي", size: "كبير" },
  { name: "بجعة", category: "طيور", habitat: "مائي", size: "كبير" },
  { name: "فلامنجو", category: "طيور", habitat: "مائي", size: "كبير" },
  { name: "دجاجة", category: "طيور", habitat: "مزرعة", size: "صغير" },
  { name: "ديك", category: "طيور", habitat: "مزرعة", size: "صغير" },
  { name: "ديك رومي", category: "طيور", habitat: "مزرعة", size: "متوسط" },
  { name: "عصفور", category: "طيور", habitat: "غابة", size: "صغير" },
  { name: "حمامة", category: "طيور", habitat: "مدينة", size: "صغير" },
  { name: "غراب", category: "طيور", habitat: "غابة", size: "متوسط" },
  { name: "طوقان", category: "طيور", habitat: "غابة", size: "متوسط" },
  { name: "طائر الطنان", category: "طيور", habitat: "غابة", size: "صغير" },
  { name: "نعامة", category: "طيور", habitat: "سافانا", size: "ضخم" },
  { name: "بطريق", category: "طيور", habitat: "قطبي", size: "متوسط" },
];

export const wordsByCategory: Record<string, string[]> = {
  countries: [
    "مصر", "السعودية", "الإمارات", "الكويت", "قطر", "البحرين", "عمان", "الأردن",
    "لبنان", "سوريا", "العراق", "فلسطين", "اليمن", "ليبيا", "تونس", "الجزائر",
    "المغرب", "السودان", "موريتانيا", "الصومال", "جيبوتي", "جزر القمر",
    "تركيا", "إيران", "باكستان", "الهند", "الصين", "اليابان", "كوريا الجنوبية",
    "كوريا الشمالية", "تايلاند", "ماليزيا", "إندونيسيا", "فيتنام", "الفلبين",
    "سنغافورة", "تايوان", "هونج كونج", "بنغلاديش", "سريلانكا", "نيبال",
    "أفغانستان", "كازاخستان", "أوزبكستان", "قيرغيزستان", "طاجيكستان",
    "تركمانستان", "أذربيجان", "جورجيا", "أرمينيا", "منغوليا", "ميانمار",
    "كمبوديا", "لاوس", "بروناي", "تيمور الشرقية", "المالديف", "بوتان",
    "فرنسا", "ألمانيا", "إيطاليا", "إسبانيا", "بريطانيا", "روسيا", "أوكرانيا",
    "بولندا", "رومانيا", "هولندا", "بلجيكا", "اليونان", "التشيك", "البرتغال",
    "السويد", "المجر", "بيلاروسيا", "النمسا", "سويسرا", "بلغاريا", "صربيا",
    "الدنمارك", "فنلندا", "النرويج", "أيرلندا", "كرواتيا", "البوسنة والهرسك",
    "سلوفاكيا", "ليتوانيا", "سلوفينيا", "لاتفيا", "إستونيا", "قبرص",
    "لوكسمبورغ", "مالطا", "أيسلندا", "ألبانيا", "مقدونيا الشمالية",
    "الجبل الأسود", "موناكو", "ليختنشتاين", "أندورا", "سان مارينو", "الفاتيكان",
    "أمريكا", "كندا", "المكسيك", "البرازيل", "الأرجنتين", "كولومبيا", "تشيلي",
    "بيرو", "فنزويلا", "الإكوادور", "بوليفيا", "باراغواي", "أوروغواي",
    "غيانا", "سورينام", "كوبا", "جامايكا", "هايتي", "جمهورية الدومينيكان",
    "بورتوريكو", "بنما", "كوستاريكا", "غواتيمالا", "هندوراس", "السلفادور",
    "نيكاراغوا", "بليز", "ترينيداد وتوباغو", "باهاماس", "بربادوس",
    "أستراليا", "نيوزيلندا", "فيجي", "بابوا غينيا الجديدة", "ساموا", "تونغا",
    "نيجيريا", "إثيوبيا", "كينيا", "جنوب أفريقيا", "تنزانيا", "أوغندا",
    "الكونغو", "غانا", "موزمبيق", "مدغشقر", "الكاميرون", "ساحل العاج",
    "النيجر", "مالي", "بوركينا فاسو", "السنغال", "زيمبابوي", "تشاد",
    "غينيا", "رواندا", "بنين", "بوروندي", "توغو", "سيراليون", "ليبيريا",
    "موريشيوس", "إريتريا", "ناميبيا", "بتسوانا", "ليسوتو", "غامبيا",
    "غينيا بيساو", "غينيا الاستوائية", "الجابون", "الرأس الأخضر",
  ],
  fruits_vegetables: fruitsVegetablesWithMetadata.map(w => w.name),
  animals: animalsWithMetadata.map(w => w.name),
  cars: [
    "تويوتا", "تويوتا كامري", "تويوتا كورولا", "تويوتا لاند كروزر", "تويوتا برادو",
    "تويوتا هايلكس", "تويوتا راف فور", "تويوتا يارس", "تويوتا أفالون",
    "هوندا", "هوندا أكورد", "هوندا سيفيك", "هوندا سي آر في", "هوندا بايلوت",
    "نيسان", "نيسان ألتيما", "نيسان باترول", "نيسان صني", "نيسان إكس تريل",
    "نيسان ماكسيما", "نيسان جوك", "نيسان مورانو", "نيسان باثفايندر",
    "مازدا", "مازدا 3", "مازدا 6", "مازدا سي إكس 5", "مازدا سي إكس 9",
    "سوبارو", "سوبارو أوتباك", "سوبارو فورستر", "سوبارو إمبريزا",
    "ميتسوبيشي", "ميتسوبيشي باجيرو", "ميتسوبيشي لانسر", "ميتسوبيشي أوتلاندر",
    "لكزس", "لكزس إي إس", "لكزس آر إكس", "لكزس إل إكس", "لكزس جي إكس",
    "إنفينيتي", "إنفينيتي كيو إكس", "إنفينيتي كيو 50",
    "هيونداي", "هيونداي سوناتا", "هيونداي إلنترا", "هيونداي توسان",
    "هيونداي سانتا في", "هيونداي أكسنت", "هيونداي باليسيد",
    "كيا", "كيا أوبتيما", "كيا سورينتو", "كيا سبورتاج", "كيا كارنيفال",
    "كيا سيراتو", "كيا تيلورايد", "كيا ستينجر",
    "فورد", "فورد موستانج", "فورد إكسبلورر", "فورد إكسبيديشن", "فورد إف 150",
    "فورد رانجر", "فورد إيدج", "فورد فوكس", "فورد فيوجن",
    "شيفروليه", "شيفروليه كامارو", "شيفروليه تاهو", "شيفروليه سوبربان",
    "شيفروليه سيلفرادو", "شيفروليه ماليبو", "شيفروليه إكوينوكس",
    "جي إم سي", "جي إم سي يوكون", "جي إم سي سييرا", "جي إم سي أكاديا",
    "دودج", "دودج تشارجر", "دودج تشالنجر", "دودج دورانجو", "دودج رام",
    "جيب", "جيب رانجلر", "جيب جراند شيروكي", "جيب كومباس", "جيب شيروكي",
    "كرايسلر", "كرايسلر 300", "كرايسلر باسيفيكا",
    "كاديلاك", "كاديلاك إسكاليد", "كاديلاك سي تي 5", "كاديلاك إكس تي 5",
    "لينكولن", "لينكولن نافيجيتور", "لينكولن أفياتور",
    "تيسلا", "تيسلا موديل 3", "تيسلا موديل إس", "تيسلا موديل إكس", "تيسلا موديل واي",
    "مرسيدس", "مرسيدس إس كلاس", "مرسيدس إي كلاس", "مرسيدس سي كلاس",
    "مرسيدس جي كلاس", "مرسيدس جي إل إي", "مرسيدس جي إل سي", "مرسيدس إيه كلاس",
    "مرسيدس إيه إم جي",
    "بي إم دبليو", "بي إم دبليو الفئة 3", "بي إم دبليو الفئة 5", "بي إم دبليو الفئة 7",
    "بي إم دبليو إكس 3", "بي إم دبليو إكس 5", "بي إم دبليو إكس 7", "بي إم دبليو إم 3",
    "أودي", "أودي إيه 4", "أودي إيه 6", "أودي إيه 8", "أودي كيو 5", "أودي كيو 7",
    "أودي كيو 8", "أودي آر 8", "أودي إي ترون",
    "فولكس واجن", "فولكس واجن جولف", "فولكس واجن باسات", "فولكس واجن تيغوان",
    "فولكس واجن جيتا", "فولكس واجن أطلس", "فولكس واجن أرتيون",
    "بورشه", "بورشه 911", "بورشه كايين", "بورشه ماكان", "بورشه باناميرا", "بورشه تايكان",
    "فيراري", "فيراري 488", "فيراري إف 8", "فيراري روما", "فيراري بورتوفينو",
    "لامبورغيني", "لامبورغيني هوراكان", "لامبورغيني أوروس", "لامبورغيني أفنتادور",
    "ماكلارين", "ماكلارين 720 إس", "ماكلارين جي تي",
    "أستون مارتن", "أستون مارتن دي بي 11", "أستون مارتن فانتاج",
    "بنتلي", "بنتلي كونتيننتال", "بنتلي بنتايغا", "بنتلي فلاينج سبير",
    "رولز رويس", "رولز رويس فانتوم", "رولز رويس جوست", "رولز رويس كولينان",
    "جاكوار", "جاكوار إف تايب", "جاكوار إكس إف", "جاكوار إف بيس",
    "لاند روفر", "لاند روفر ديفندر", "لاند روفر ديسكفري",
    "رينج روفر", "رينج روفر سبورت", "رينج روفر فيلار", "رينج روفر إيفوك",
    "فولفو", "فولفو إكس سي 90", "فولفو إكس سي 60", "فولفو إس 60", "فولفو إس 90",
    "بيجو", "بيجو 208", "بيجو 308", "بيجو 3008", "بيجو 5008",
    "رينو", "رينو كليو", "رينو ميغان", "رينو كابتشور", "رينو داستر",
    "سيتروين", "سيتروين سي 3", "سيتروين سي 4", "سيتروين سي 5",
    "فيات", "فيات 500", "فيات تيبو", "فيات باندا",
    "ألفا روميو", "ألفا روميو جوليا", "ألفا روميو ستيلفيو",
    "مازيراتي", "مازيراتي جيبلي", "مازيراتي ليفانتي", "مازيراتي كواتروبورتي",
    "بوجاتي", "بوجاتي شيرون", "بوجاتي فيرون",
    "ميني كوبر", "ميني كونتري مان",
    "سوزوكي", "سوزوكي سويفت", "سوزوكي فيتارا", "سوزوكي جيمني",
    "سكودا", "سكودا أوكتافيا", "سكودا كودياك", "سكودا سوبيرب",
    "إم جي", "إم جي زد إس", "إم جي آر إكس 5",
    "جينيسيس", "جينيسيس جي 70", "جينيسيس جي 80", "جينيسيس جي في 80",
    "هامر", "هامر إي في",
    "لوتس", "لوتس إلتر",
  ],
};

export function getRandomWord(category: string): string {
  const words = wordsByCategory[category] || wordsByCategory.countries;
  return words[Math.floor(Math.random() * words.length)];
}

// Country regions for better pairing in blind mode
const countryRegions: Record<string, string[]> = {
  "الخليج العربي": ["السعودية", "الإمارات", "الكويت", "قطر", "البحرين", "عمان"],
  "الشام": ["الأردن", "لبنان", "سوريا", "فلسطين", "العراق"],
  "شمال أفريقيا": ["مصر", "ليبيا", "تونس", "الجزائر", "المغرب", "السودان", "موريتانيا"],
  "القرن الأفريقي": ["الصومال", "جيبوتي", "إريتريا", "إثيوبيا"],
  "جنوب آسيا": ["الهند", "باكستان", "بنغلاديش", "سريلانكا", "نيبال", "بوتان", "المالديف", "أفغانستان"],
  "شرق آسيا": ["الصين", "اليابان", "كوريا الجنوبية", "كوريا الشمالية", "تايوان", "هونج كونج", "منغوليا"],
  "جنوب شرق آسيا": ["تايلاند", "ماليزيا", "إندونيسيا", "فيتنام", "الفلبين", "سنغافورة", "ميانمار", "كمبوديا", "لاوس", "بروناي", "تيمور الشرقية"],
  "آسيا الوسطى": ["كازاخستان", "أوزبكستان", "قيرغيزستان", "طاجيكستان", "تركمانستان"],
  "القوقاز": ["أذربيجان", "جورجيا", "أرمينيا"],
  "الشرق الأوسط": ["تركيا", "إيران"],
  "غرب أوروبا": ["فرنسا", "ألمانيا", "هولندا", "بلجيكا", "لوكسمبورغ", "سويسرا", "النمسا"],
  "جنوب أوروبا": ["إيطاليا", "إسبانيا", "البرتغال", "اليونان", "قبرص", "مالطا"],
  "شمال أوروبا": ["بريطانيا", "أيرلندا", "السويد", "النرويج", "الدنمارك", "فنلندا", "أيسلندا"],
  "شرق أوروبا": ["روسيا", "أوكرانيا", "بولندا", "رومانيا", "التشيك", "المجر", "بيلاروسيا", "بلغاريا", "صربيا", "كرواتيا", "سلوفاكيا", "سلوفينيا"],
  "البلطيق": ["ليتوانيا", "لاتفيا", "إستونيا"],
  "البلقان": ["البوسنة والهرسك", "ألبانيا", "مقدونيا الشمالية", "الجبل الأسود", "كوسوفو"],
  "أمريكا الشمالية": ["أمريكا", "كندا", "المكسيك"],
  "أمريكا الجنوبية": ["البرازيل", "الأرجنتين", "كولومبيا", "تشيلي", "بيرو", "فنزويلا", "الإكوادور", "بوليفيا", "باراغواي", "أوروغواي"],
  "أمريكا الوسطى والكاريبي": ["كوبا", "جامايكا", "هايتي", "جمهورية الدومينيكان", "بورتوريكو", "بنما", "كوستاريكا", "غواتيمالا", "هندوراس", "السلفادور", "نيكاراغوا", "بليز"],
  "أوقيانوسيا": ["أستراليا", "نيوزيلندا", "فيجي", "بابوا غينيا الجديدة", "ساموا", "تونغا"],
  "غرب أفريقيا": ["نيجيريا", "غانا", "ساحل العاج", "السنغال", "مالي", "بوركينا فاسو", "النيجر", "غينيا", "بنين", "توغو", "سيراليون", "ليبيريا", "غامبيا", "غينيا بيساو"],
  "شرق أفريقيا": ["كينيا", "تنزانيا", "أوغندا", "رواندا", "بوروندي"],
  "جنوب أفريقيا": ["جنوب أفريقيا", "موزمبيق", "مدغشقر", "زيمبابوي", "ناميبيا", "بتسوانا", "ليسوتو", "موريشيوس"],
  "وسط أفريقيا": ["الكونغو", "الكاميرون", "تشاد", "غينيا الاستوائية", "الجابون"],
};

function getCountryRegion(country: string): string | undefined {
  for (const [region, countries] of Object.entries(countryRegions)) {
    if (countries.includes(country)) {
      return region;
    }
  }
  return undefined;
}

export function getDifferentWord(category: string, excludeWord: string): string {
  const words = wordsByCategory[category] || wordsByCategory.countries;
  const filteredWords = words.filter((w) => w !== excludeWord);
  return filteredWords[Math.floor(Math.random() * filteredWords.length)];
}

export function getSimilarWord(category: string, excludeWord: string): string {
  // For fruits_vegetables: MUST match same type (fruit with fruit, vegetable with vegetable)
  if (category === "fruits_vegetables") {
    const wordData = fruitsVegetablesWithMetadata.find(w => w.name === excludeWord);
    if (wordData) {
      // First, get all words of the same type (fruit/vegetable)
      const sameTypeWords = fruitsVegetablesWithMetadata.filter(w => 
        w.name !== excludeWord && w.type === wordData.type
      );
      
      if (sameTypeWords.length > 0) {
        // Score them by similarity (color, size)
        const scoredWords = sameTypeWords.map(w => {
          let score = 0;
          if (w.color === wordData.color) score += 2;
          if (w.size === wordData.size) score += 1;
          return { word: w, score };
        });
        
        // Sort by score (highest first) and take from top candidates
        scoredWords.sort((a, b) => b.score - a.score);
        const maxScore = scoredWords[0].score;
        const topCandidates = scoredWords.filter(s => s.score >= maxScore - 1);
        
        return topCandidates[Math.floor(Math.random() * topCandidates.length)].word.name;
      }
    }
    // Fallback: return any different fruit/vegetable (shouldn't happen with good data)
    return getDifferentWord(category, excludeWord);
  }
  
  // For animals: prefer same category and similar habitat
  if (category === "animals") {
    const wordData = animalsWithMetadata.find(w => w.name === excludeWord);
    if (wordData) {
      // First, try to find animals in the same category
      const sameCategoryWords = animalsWithMetadata.filter(w => 
        w.name !== excludeWord && w.category === wordData.category
      );
      
      if (sameCategoryWords.length > 0) {
        // Score by habitat and size similarity
        const scoredWords = sameCategoryWords.map(w => {
          let score = 0;
          if (w.habitat === wordData.habitat) score += 2;
          if (w.size === wordData.size) score += 1;
          return { word: w, score };
        });
        
        scoredWords.sort((a, b) => b.score - a.score);
        const maxScore = scoredWords[0].score;
        const topCandidates = scoredWords.filter(s => s.score >= maxScore - 1);
        
        return topCandidates[Math.floor(Math.random() * topCandidates.length)].word.name;
      }
      
      // Fallback to same habitat if no same category
      const sameHabitatWords = animalsWithMetadata.filter(w => 
        w.name !== excludeWord && w.habitat === wordData.habitat
      );
      
      if (sameHabitatWords.length > 0) {
        return sameHabitatWords[Math.floor(Math.random() * sameHabitatWords.length)].name;
      }
    }
    return getDifferentWord(category, excludeWord);
  }
  
  // For countries: MUST be from the same region
  if (category === "countries") {
    const region = getCountryRegion(excludeWord);
    if (region) {
      const regionCountries = countryRegions[region].filter(c => c !== excludeWord);
      if (regionCountries.length > 0) {
        return regionCountries[Math.floor(Math.random() * regionCountries.length)];
      }
    }
    // If country not in any defined region, find a nearby region country
    // Fallback to any different country (but this shouldn't happen often)
    return getDifferentWord(category, excludeWord);
  }
  
  // For cars: try to match brand, but avoid pairing brand-only with brand+model
  if (category === "cars") {
    const words = wordsByCategory.cars;
    // Extract brand from the word (first word is usually the brand)
    const excludeParts = excludeWord.split(' ');
    const excludeBrand = excludeParts[0];
    const excludeHasModel = excludeParts.length > 1;
    
    // Find other cars from the same brand
    const sameBrandCars = words.filter(w => {
      if (w === excludeWord) return false;
      const parts = w.split(' ');
      const brand = parts[0];
      const hasModel = parts.length > 1;
      
      // Must be same brand
      if (brand !== excludeBrand) return false;
      
      // Both should have models, or both should be brand-only
      // This prevents pairing "تويوتا" with "تويوتا كامري"
      return hasModel === excludeHasModel;
    });
    
    if (sameBrandCars.length > 0) {
      return sameBrandCars[Math.floor(Math.random() * sameBrandCars.length)];
    }
    
    // Fallback: find any car with same brand (even if model status differs)
    const anyBrandCars = words.filter(w => 
      w !== excludeWord && w.startsWith(excludeBrand + ' ')
    );
    
    if (anyBrandCars.length > 0) {
      return anyBrandCars[Math.floor(Math.random() * anyBrandCars.length)];
    }
    
    // Last fallback: return any different car
    return getDifferentWord(category, excludeWord);
  }
  
  return getDifferentWord(category, excludeWord);
}
