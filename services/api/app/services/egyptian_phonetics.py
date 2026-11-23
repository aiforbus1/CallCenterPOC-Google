"""
Egyptian Arabic Phonetic Normalizer for Neural TTS.

Enhances raw Egyptian colloquial Arabic text with subtle phonetics and diacritics
so that Neural TTS engines (OpenAI tts-1, ElevenLabs, Google TTS, Android TTS)
pronounce Egyptian slang words authentically without defaulting to classical Modern Standard Arabic.
"""
import re

EGYPTIAN_PHONETIC_RULES = [
    # Customer service honorifics & greetings
    (r"\bيا فندم\b", "يا فَنْدِم"),
    (r"\bفندم\b", "فَنْدِم"),
    (r"\bيا باشا\b", "يا بَاشَا"),
    (r"\bأهلاً بيك\b", "أهْلاً بيكْ"),
    (r"\bأهلاً بيكي\b", "أهْلاً بِيكِي"),
    (r"\bتؤمرني\b", "تُؤْمُرْنِي"),
    (r"\bتحت أمرك\b", "تَحْت أَمْرَكْ"),
    (r"\bعينيّ ليك\b", "عِينَيَّ لِيكْ"),
    (r"\bمن عينيا\b", "مِنْ عِينَيَّا"),
    (r"\bنورتنا\b", "نَوَّرْتِنَا"),
    (r"\bالعفو\b", "العَفْو"),
    (r"\bتسلم\b", "تِسْلَمْ"),
    (r"\bشرف لينا\b", "شَرَفْ لِينَا"),

    # Common temporal & conversational slang
    (r"\bدلوقتي\b", "دِلْوَقْتي"),
    (r"\bدلوقت\b", "دِلْوَقْت"),
    (r"\bامبارح\b", "امْبارِح"),
    (r"\bإمبارح\b", "امْبارِح"),
    (r"\bالنهاردة\b", "النَّهَارْدَه"),
    (r"\bالنهارده\b", "النَّهَارْدَه"),
    (r"\bبكرة\b", "بُكْرَه"),
    (r"\bبكره\b", "بُكْرَه"),
    (r"\bالضهر\b", "الضُّهْر"),
    (r"\bالصبح\b", "الصُّبْح"),
    (r"\bبالليل\b", "بِاللِّيل"),
    (r"\bشوية\b", "شُوَيَّة"),
    (r"\bشويه\b", "شُوَيَّة"),
    (r"\bتاني\b", "تَانِي"),

    # Pronouns, prepositions, demonstratives
    (r"\bكده\b", "كِدَه"),
    (r"\bكدا\b", "كِدَه"),
    (r"\bإيه\b", "إيهْ"),
    (r"\bايه\b", "إيهْ"),
    (r"\bليه\b", "لِيهْ"),
    (r"\bمين\b", "مِينْ"),
    (r"\bفين\b", "فِينْ"),
    (r"\bإزاي\b", "إزَّايْ"),
    (r"\bازاي\b", "إزَّايْ"),
    (r"\bبتاعك\b", "بِتَاعَكْ"),
    (r"\bبتاعته\b", "بِتَاعْتُه"),
    (r"\bبتاعتي\b", "بِتَاعْتِي"),
    (r"\bعلشان\b", "عَلَشَانْ"),
    (r"\bعشان\b", "عَشَانْ"),

    # Negative particles & common verbs
    (r"\bمش\b", "مِشْ"),
    (r"\bمفيش\b", "مَفِيشْ"),
    (r"\bمفيهوش\b", "مَفِيهُوشْ"),
    (r"\bمفيهاش\b", "مَفِيهَاشْ"),
    (r"\bمعلش\b", "مَعْلِشْ"),
    (r"\bعايز\b", "عَايِز"),
    (r"\bعايزة\b", "عَايْزَة"),
    (r"\bعايزين\b", "عَايْزِينْ"),
    (r"\bشغال\b", "شَغَّال"),
    (r"\bشغالة\b", "شَغَّالَة"),
    (r"\bواقف\b", "وَاقِفْ"),
    (r"\bواقفة\b", "وَاقْفَة"),
    (r"\bهظبطهالك\b", "هَظَبَّطْهَالَكْ"),
    (r"\bهظبطلك\b", "هَظَبَّطْلَكْ"),
    (r"\bأثبتلك\b", "أَثَبِّتْلَكْ"),
    (r"\bأأكدلك\b", "أأَكِّدْلَكْ"),
    (r"\bسمّعت\b", "سَمَّعِتْ"),
    (r"\bسمعت\b", "سَمَّعِتْ"),

    # Common Egyptian idioms & reassurance
    (r"\bزي الفل\b", "زَيّ الفُلّ"),
    (r"\bاطمن\b", "اطْمَنّ"),
    (r"\bاطمني\b", "اطْمَنِّي"),
    (r"\bحقك عليا\b", "حَقَّكْ عَلَيَّا"),
    (r"\bولا يهمك\b", "وَلَا يِهِمَّكْ"),
    (r"\bمتزعلش\b", "مَتِزْعَلْش"),
    (r"\bأكتر\b", "أكْتَر"),
    (r"\bأحسن\b", "أحْسَن"),
]


def normalize_for_egyptian_tts(text: str) -> str:
    """
    Apply Egyptian slang phonetic normalization to text before sending to TTS.
    Preserves English and numbers intact while enhancing Arabic slang pronunciation.
    """
    if not text:
        return text

    normalized = text
    for pattern, replacement in EGYPTIAN_PHONETIC_RULES:
        normalized = re.sub(pattern, replacement, normalized)

    return normalized
