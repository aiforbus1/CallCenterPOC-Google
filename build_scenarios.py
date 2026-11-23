import json

SCENARIOS_QUESTIONS = [
    {
        "id": "q_caller_name",
        "order": 1,
        "text": "اسم حضرتك بالكامل يا فندم لإثبات البلاغ؟",
        "english_text": "What is your full name, sir, to register the emergency report?",
        "field_key": "caller_name",
        "is_required": True,
        "options": [],
        "acknowledgment_prefix": "أهلاً بحضرتك يا فندم.",
        "english_acknowledgment_prefix": "Thank you, sir."
    },
    {
        "id": "q_phone_number",
        "order": 2,
        "text": "رقم تليفون حضرتك للتواصل ومتابعة تحرك الدورية الأمنية؟",
        "english_text": "What is your contact phone number to follow up on the dispatched police patrol?",
        "field_key": "phone_number",
        "is_required": True,
        "options": [],
        "acknowledgment_prefix": "تمام يا فندم سجلت الرقم.",
        "english_acknowledgment_prefix": "Phone number recorded."
    },
    {
        "id": "q_incident_location",
        "order": 3,
        "text": "مكان البلاغ فين بالتفصيل يا فندم؟ المحافظة، المنطقة، والشارع أو أقرب علامة مميزة؟",
        "english_text": "What is the exact location, sir? Governorate, district, street, or nearest landmark?",
        "field_key": "incident_location",
        "is_required": True,
        "options": [],
        "acknowledgment_prefix": "تمام يا فندم، حددت الموقع.",
        "english_acknowledgment_prefix": "Location confirmed."
    },
    {
        "id": "q_incident_type",
        "order": 4,
        "text": "إيه نوع البلاغ أو الحادث اللي حضرتك بتبلغ عنه؟ مشاجرة واعتداء، حادث تصادم وطرق، حريق وإنقاذ، مفقودين أو وفيات، ولا خدمات ومشكلات عامة؟",
        "english_text": "What is the nature of the emergency? Brawl/assault, traffic accident, fire/rescue, missing person/deceased, or public service hazard?",
        "field_key": "incident_type",
        "is_required": True,
        "acknowledgment_prefix": "فهمت حضرتك تماماً.",
        "english_acknowledgment_prefix": "Understood.",
        "options": [
            # ====================================================
            # أولاً: بلاغات الحوادث والطرق (السيناريوهات 1 - 5)
            # ====================================================
            {
                "id": "opt_traffic_crash",
                "label": "حادثة تصادم سيارات",
                "english_label": "Traffic collision",
                "category": "حادث مروري / تصادم",
                "department_id": "dept_traffic",
                "keywords": ["تصادم", "خبطت", "خبطوا", "عربية خبطت", "ميكروباص", "ملاكي", "حادثة", "خبطة", "حادث تصادم", "خبطت في ميكروباص", "crash", "collision"],
                "actions": [
                    {"action_type": "categorize", "target_value": "حادث مروري / تصادم"},
                    {"action_type": "assign_department", "department_name": "الإدارة العامة للمرور", "department_phone": "136"},
                    {"action_type": "outbound_call", "target_value": "136", "department_name": "الإدارة العامة للمرور", "department_phone": "136"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_crash_1",
                        "order": 1,
                        "text": "إيه العربيات اللي خبطت في بعض؟ وهل في حد اتصاب في الحادثة؟",
                        "english_text": "What vehicles collided, and are there any injured persons?",
                        "field_key": "crash_injuries",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_crash_2",
                        "order": 2,
                        "text": "المصاب واعي وبيتكلم؟ وهل في زحمة بسبب الحادثة والطريق بدأ يقف ومحتاج ونش وإسعاف؟",
                        "english_text": "Is the injured person conscious, and is the road blocked requiring a tow truck and ambulance?",
                        "field_key": "crash_traffic_status",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_traffic_rollover",
                "label": "انقلاب سيارة أو حادث خطير",
                "english_label": "Vehicle rollover or severe crash",
                "category": "حادث مروري خطير / انقلاب",
                "department_id": "dept_traffic",
                "keywords": ["انقلاب", "اتقلبت", "مقلوبة", "انقلبت", "على سقفها", "حادث خطير", "محبوسين جوه العربية", "rollover", "overturn"],
                "actions": [
                    {"action_type": "categorize", "target_value": "حادث مروري خطير / انقلاب"},
                    {"action_type": "assign_department", "department_name": "الإدارة العامة للمرور والحماية المدنية", "department_phone": "136"},
                    {"action_type": "outbound_call", "target_value": "136", "department_name": "الإدارة العامة للمرور", "department_phone": "136"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_rollover_1",
                        "order": 1,
                        "text": "العربية اتقلبت على جنبها ولا على سقفها؟ وهل في حد محبوس جواها ومش عارفين يخرجوا؟",
                        "english_text": "Did the car roll on its side or roof, and is anyone trapped inside unable to get out?",
                        "field_key": "rollover_trapped",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_rollover_2",
                        "order": 2,
                        "text": "حد من المصابين بيتكلم أو فاقد الوعي؟ وهل الطريق خطر على مسار باقي العربيات؟",
                        "english_text": "Is any of the injured speaking or unconscious, and is the road hazardous for incoming traffic?",
                        "field_key": "rollover_conscious_hazard",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_traffic_breakdown",
                "label": "عربية عطلانة وقافلة الطريق وزحمة",
                "english_label": "Stalled vehicle blocking roadway",
                "category": "تعطيل طريق / زحام مروري",
                "department_id": "dept_traffic",
                "keywords": ["عربية واقفة", "عطلانة", "عطلت", "زحمة", "قافلة الدنيا", "نقل واقفة", "تعطيل", "واقفة في نص الطريق", "واخدة حارتين", "stalled", "traffic jam"],
                "actions": [
                    {"action_type": "categorize", "target_value": "تعطيل طريق / زحام مروري"},
                    {"action_type": "assign_department", "department_name": "الإدارة العامة للمرور", "department_phone": "136"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_stalled_1",
                        "order": 1,
                        "text": "العربية بايظة ولا السواق واقف لأي سبب؟ وواخدة كام حارة من الطريق؟",
                        "english_text": "Is the vehicle broken down or parked for another reason, and how many lanes is it blocking?",
                        "field_key": "stalled_lanes_blocked",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_stalled_2",
                        "order": 2,
                        "text": "في أي تصادم أو إصابات ولا مجرد تعطيل مرور ومحتاجة ونش لسحبها؟",
                        "english_text": "Is there any collision or injury, or is it strictly traffic congestion needing a tow truck?",
                        "field_key": "stalled_injuries_tow",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_traffic_hitandrun",
                "label": "سائق هارب بعد حادثة",
                "english_label": "Hit and run driver",
                "category": "سائق هارب / حادث مروري",
                "department_id": "dept_traffic",
                "keywords": ["هرب", "خبط وجري", "خبط وهرب", "سائق هارب", "عربية هربت", "جري بعد الحادثة", "hit and run"],
                "actions": [
                    {"action_type": "categorize", "target_value": "سائق هارب / حادث مروري"},
                    {"action_type": "assign_department", "department_name": "المباحث الجنائية والمرور", "department_phone": "136"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_hitrun_1",
                        "order": 1,
                        "text": "العربية اللي هربت نوعها ولونها إيه؟ ورقم اللوحة واضح معاك أو حروفه؟",
                        "english_text": "What make and color is the fleeing car, and did you catch the license plate numbers or letters?",
                        "field_key": "hitrun_vehicle_plate",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_hitrun_2",
                        "order": 2,
                        "text": "السواق خبط عربية بس ولا في أشخاص اتصابوا؟ ومعاك أي بيانات عن اتجاه سيرها؟",
                        "english_text": "Did the driver hit just a vehicle or were persons injured? Do you have any direction of travel?",
                        "field_key": "hitrun_injuries_direction",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_road_blockade",
                "label": "قطع طريق وتجمهر",
                "english_label": "Road blockade or crowd gathering",
                "category": "قطع طريق / تجمهر",
                "department_id": "dept_122_ops",
                "keywords": ["قطع طريق", "قفل الطريق", "تجمهر", "ناس واقفة في الشارع", "بيمنعوا العربيات", "الطريق مقفول", "قاطعين الطريق", "blockade"],
                "actions": [
                    {"action_type": "categorize", "target_value": "قطع طريق / تجمهر"},
                    {"action_type": "assign_department", "department_name": "غرفة عمليات النجدة والأمن العام", "department_phone": "122"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_block_1",
                        "order": 1,
                        "text": "إيه سبب قفل الطريق؟ وعدد الأشخاص المتواجدين كام تقريباً؟",
                        "english_text": "What is the reason for the blockade, and approximately how many people are gathered?",
                        "field_key": "blockade_reason_count",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_block_2",
                        "order": 2,
                        "text": "في خناقات أو اعتداءات؟ وهل في عربيات إسعاف أو طوارئ مش قادرة تعدي؟",
                        "english_text": "Are there fights or assaults, and are ambulances or emergency vehicles unable to pass?",
                        "field_key": "blockade_violence_emergency",
                        "is_required": True,
                        "options": []
                    }
                ]
            },

            # ====================================================
            # ثانياً: بلاغات المشاجرات والاعتداءات (السيناريوهات 6 - 9)
            # ====================================================
            {
                "id": "opt_brawl_fight",
                "label": "مشاجرة بين جيران أو بمحل أو شارع",
                "english_label": "Brawl or physical assault",
                "category": "مشاجرة / اعتداء / ضرب",
                "department_id": "dept_cid",
                "keywords": ["مشاجرة", "خناقة", "مشغرة", "عراك", "ضرب", "بيضربوا بعض", "خناقة بين جيران", "خناقة في محل", "بلطجة", "brawl", "fight"],
                "actions": [
                    {"action_type": "categorize", "target_value": "مشاجرة / اعتداء / ضرب"},
                    {"action_type": "assign_department", "department_name": "المباحث الجنائية وقسم الشرطة", "department_phone": "+201220000001"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_brawl_1",
                        "order": 1,
                        "text": "الخناقة بين كام شخص؟ وهل في حد ماسك سلاح أبيض أو كراسي أو أدوات اعتداء؟",
                        "english_text": "How many persons are involved, and is anyone carrying weapons, chairs, or assault tools?",
                        "field_key": "brawl_people_weapons",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_brawl_2",
                        "order": 2,
                        "text": "في إصابات أو حد وقع على الأرض؟ والخناقة لسه مستمرة حالياً؟",
                        "english_text": "Are there injuries or someone on the ground, and is the fight still actively ongoing?",
                        "field_key": "brawl_injuries_ongoing",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_domestic_assault",
                "label": "اعتداء أسري وتهديد سيدة أو أطفال",
                "english_label": "Domestic violence or family assault",
                "category": "اعتداء أسري / تهديد",
                "department_id": "dept_cid",
                "keywords": ["بيضربني", "اعتداء على سيدة", "عنف أسري", "بيكسر في البيت", "تهديد", "اعتداء", "جوزي بيضربني", "domestic violence"],
                "actions": [
                    {"action_type": "categorize", "target_value": "اعتداء أسري / تهديد"},
                    {"action_type": "assign_department", "department_name": "شرطة النجدة وقسم الشرطة المختص", "department_phone": "122"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_domestic_1",
                        "order": 1,
                        "text": "الشخص المعتدي لسه موجود معاكي ومعاه أي سلاح؟ وهل في أطفال في البيت؟",
                        "english_text": "Is the aggressor still present with you and armed? Are there children in the house?",
                        "field_key": "domestic_aggressor_children",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_domestic_2",
                        "order": 2,
                        "text": "حضرتك تقدري تكوني في مكان آمن بعيد عنه لحد ما دورية النجدة توصل فوراً؟",
                        "english_text": "Can you retreat to a safe locked spot away from him until the police patrol arrives immediately?",
                        "field_key": "domestic_safety_distance",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_gunfire_shooting",
                "label": "إطلاق نار وضرب رصاص حي",
                "english_label": "Active gunfire or shooting",
                "category": "إطلاق نار / أسلحة نارية",
                "department_id": "dept_cid",
                "keywords": ["ضرب نار", "إطلاق نار", "طلقات", "خرطوش", "سلاح ناري", "رصاص", "gunfire", "shooting"],
                "actions": [
                    {"action_type": "categorize", "target_value": "إطلاق نار / أسلحة نارية"},
                    {"action_type": "assign_department", "department_name": "المباحث الجنائية والأمن العام", "department_phone": "122"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_gun_1",
                        "order": 1,
                        "text": "إطلاق النار لسه مستمر؟ وشايف الشخص اللي بيضرب نار أو معالم ليه؟",
                        "english_text": "Is the gunfire still actively ongoing, and can you see the shooter or their description?",
                        "field_key": "gunfire_status_shooter",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_gun_2",
                        "order": 2,
                        "text": "في حد اتصاب أو وقع على الأرض؟ وخليك في مكان محمي تماماً وماتخرجش.",
                        "english_text": "Has anyone been injured or fallen to the ground? Stay in a sheltered spot and do not peek out.",
                        "field_key": "gunfire_injuries_safety",
                        "is_required": True,
                        "options": []
                    }
                ]
            },

            # ====================================================
            # ثالثاً: بلاغات الحرائق والإنقاذ (السيناريوهات 10 - 13)
            # ====================================================
            {
                "id": "opt_fire_outbreak",
                "label": "حريق في محل أو عقار أو مخزن",
                "english_label": "Building or store fire outbreak",
                "category": "حريق / إنقاذ إطفاء",
                "department_id": "dept_civil_defense",
                "keywords": ["حريق", "بيولع", "مولعة", "نار", "دخان", "حريقة", "محل بيولع", "شقة بتولع", "عقار بيولع", "fire"],
                "actions": [
                    {"action_type": "categorize", "target_value": "حريق / إنقاذ إطفاء"},
                    {"action_type": "assign_department", "department_name": "الحماية المدنية والمطافئ", "department_phone": "180"},
                    {"action_type": "outbound_call", "target_value": "180", "department_name": "الحماية المدنية", "department_phone": "180"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_fire_1",
                        "order": 1,
                        "text": "النار بدأت منين وفيه دخان كثيف؟ وهل في حد من العمال أو السكان محبوس جوه؟",
                        "english_text": "Where did the fire start, is there dense smoke, and are any workers or residents trapped inside?",
                        "field_key": "fire_origin_trapped_smoke",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_gas_leak",
                "label": "تسرب غاز في عمارة أو شارع",
                "english_label": "Gas leak in building",
                "category": "تسرب غاز / مواد خطرة",
                "department_id": "dept_civil_defense",
                "keywords": ["تسرب غاز", "ريحة غاز", "غاز قوي", "تسريب غاز", "صوت تسريب", "gas leak"],
                "actions": [
                    {"action_type": "categorize", "target_value": "تسرب غاز / مواد خطرة"},
                    {"action_type": "assign_department", "department_name": "طوارئ الغاز والحماية المدنية", "department_phone": "180"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_gas_1",
                        "order": 1,
                        "text": "الريحة في العمارة كلها ولا شقة معينة؟ وهل في حد حاسس بدوخة أو إغماء؟",
                        "english_text": "Is the smell across the whole building or a specific flat? Is anyone dizzy or fainting?",
                        "field_key": "gas_scope_fainting",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_gas_2",
                        "order": 2,
                        "text": "اخرجوا لمكان آمن وماتستخدموش مفاتيح الكهرباء أو أي مصدر نار نهائياً، تمام؟",
                        "english_text": "Evacuate to open air immediately and do not toggle electrical switches or open flames. Understood?",
                        "field_key": "gas_evacuation_acknowledged",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_elevator_trap",
                "label": "أشخاص محبوسين في أسانسير",
                "english_label": "People trapped in elevator",
                "category": "احتجاز داخل مصعد / إنقاذ",
                "department_id": "dept_civil_defense",
                "keywords": ["أسانسير", "اسانسير", "محبوسين في الأسانسير", "الأسانسير عطلان", "المصعد", "elevator", "lift"],
                "actions": [
                    {"action_type": "categorize", "target_value": "احتجاز داخل مصعد / إنقاذ"},
                    {"action_type": "assign_department", "department_name": "الحماية المدنية والإنقاذ البري", "department_phone": "180"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_elev_1",
                        "order": 1,
                        "text": "في كام شخص محبوس وهل بينهم أطفال أو كبار سن؟ والأسانسير واقف بين أنهي أدوار؟",
                        "english_text": "How many persons are trapped, are there children/elderly, and which floors is it stuck between?",
                        "field_key": "elevator_people_floors",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_elev_2",
                        "order": 2,
                        "text": "هل في حد بيحاول يفتحه بالقوة؟ نبه عليهم مايفتحوش بالقوة حفاظاً على حياتهم.",
                        "english_text": "Is anyone trying to pry it open forcefully? Tell them to stop immediately for safety.",
                        "field_key": "elevator_force_safety",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_building_trap",
                "label": "شخص محاصر داخل مبنى أو مخزن",
                "english_label": "Person trapped inside structure",
                "category": "احتجاز شخص / استغاثة",
                "department_id": "dept_civil_defense",
                "keywords": ["محاصر", "محبوس ومش عارف اخرج", "الباب اتقفل عليا", "محبوس في مخزن", "محبوس جوه", "trapped inside"],
                "actions": [
                    {"action_type": "categorize", "target_value": "احتجاز شخص / استغاثة"},
                    {"action_type": "assign_department", "department_name": "الحماية المدنية والنجدة", "department_phone": "122"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_trap_1",
                        "order": 1,
                        "text": "الباب اتقفل إزاي وحضرتك لوحدك جوه؟ وقادر تتنفس كويس؟",
                        "english_text": "How did the door shut and are you alone inside? Are you able to breathe normally?",
                        "field_key": "building_trap_breathing",
                        "is_required": True,
                        "options": []
                    }
                ]
            },

            # ====================================================
            # رابعاً: بلاغات الأشخاص المفقودين والوفيات (السيناريوهات 14 - 16)
            # ====================================================
            {
                "id": "opt_lost_child",
                "label": "طفل مفقود أو تائه في سوق أو مكان عام",
                "english_label": "Lost or missing child",
                "category": "طفل مفقود / نجدة أطفال",
                "department_id": "dept_cid",
                "keywords": ["طفل مفقود", "ابني ضاع", "ابني تاه", "بنتي تاهت", "طفل تائه", "ضيعت ابني", "lost child"],
                "actions": [
                    {"action_type": "categorize", "target_value": "طفل مفقود / نجدة أطفال"},
                    {"action_type": "assign_department", "department_name": "المباحث الجنائية وقسم الشرطة", "department_phone": "122"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_child_1",
                        "order": 1,
                        "text": "اسم الطفل إيه وعنده كام سنة؟ وكان لابس إيه ومواصفاته؟",
                        "english_text": "What is the child's name and age, what was he wearing, and what are his physical features?",
                        "field_key": "lost_child_name_age_cloth",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_child_2",
                        "order": 2,
                        "text": "آخر مكان شوفتيه فيه فين بالظبط؟ وفي حد بيساعدك في البحث حالياً؟",
                        "english_text": "Where exactly did you last see him, and is someone currently assisting your search?",
                        "field_key": "lost_child_last_seen",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_missing_person",
                "label": "شخص متغيب عن المنزل",
                "english_label": "Missing adult or youth",
                "category": "شخص متغيب / بلاغات تغيب",
                "department_id": "dept_cid",
                "keywords": ["متغيب", "مختفي", "غائب", "أخويا مختفي", "شخص مفقود", "متغيب من امبارح", "missing person"],
                "actions": [
                    {"action_type": "categorize", "target_value": "شخص متغيب / بلاغات تغيب"},
                    {"action_type": "assign_department", "department_name": "المباحث الجنائية وبلاغات الغياب", "department_phone": "122"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_miss_1",
                        "order": 1,
                        "text": "اسم المتغيب وعنده كام سنة؟ وخرج إمتى وكان لابس إيه ومواصفاته الشكلية؟",
                        "english_text": "What is his name and age? When did he leave, what was he wearing, and physical description?",
                        "field_key": "missing_name_age_desc",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_miss_2",
                        "order": 2,
                        "text": "رقم تليفونه كام وهل مقفول ولا بيرن؟ وهل كان في أي خلافات قبل اختفائه؟",
                        "english_text": "What is his phone number, is it ringing or off, and were there any unusual disputes before he vanished?",
                        "field_key": "missing_phone_dispute",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_deceased_body",
                "label": "العثور على جثة أو شخص متوفى",
                "english_label": "Found deceased body",
                "category": "العثور على جثة / وفاة",
                "department_id": "dept_cid",
                "keywords": ["جثة", "متوفى", "ميت", "لقينا جثة", "شخص متوفى", "مش بيتحرك خالص", "deceased", "dead body"],
                "actions": [
                    {"action_type": "categorize", "target_value": "العثور على جثة / وفاة"},
                    {"action_type": "assign_department", "department_name": "المباحث الجنائية والنيابة العامة", "department_phone": "122"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_dead_1",
                        "order": 1,
                        "text": "الشخص ده تعرفه واسمه إيه؟ وهل في أي استجابة أو نبض ولا فاقد العلامات الحيوية؟",
                        "english_text": "Do you know this person and their name? Is there any pulse or vital signs?",
                        "field_key": "deceased_identity_pulse",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_dead_2",
                        "order": 2,
                        "text": "الشقة كانت مقفولة ولا إيه الظروف؟ وماتحركش أي حاجة حواليه وخليك مستني الدورية.",
                        "english_text": "Was the apartment locked, what were the circumstances? Do not touch the body or move objects.",
                        "field_key": "deceased_scene_security",
                        "is_required": True,
                        "options": []
                    }
                ]
            },

            # ====================================================
            # خامساً: بلاغات الخدمات والمشكلات العامة والإسعاف (السيناريوهات 17 - 20)
            # ====================================================
            {
                "id": "opt_power_sparks",
                "label": "انقطاع كهرباء وأسلاك مكشوفة بشرارة",
                "english_label": "Power outage and exposed live wire",
                "category": "انقطاع كهرباء / أسلاك مكشوفة",
                "department_id": "dept_civil_defense",
                "keywords": ["انقطاع كهرباء", "الكهرباء قاطعة", "سلك واقع", "شرارة كهرباء", "عمود نور", "سلك بيشرز", "power outage", "live wire"],
                "actions": [
                    {"action_type": "categorize", "target_value": "انقطاع كهرباء / أسلاك مكشوفة"},
                    {"action_type": "assign_department", "department_name": "طوارئ الكهرباء والحماية المدنية", "department_phone": "121"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_power_1",
                        "order": 1,
                        "text": "الكهرباء قاطعة عن الشارع كله ولا عمارة معينة؟ وهل في أسلاك واقعة بتطلع شرارة؟",
                        "english_text": "Is the power out across the entire street or one building? Are there fallen wires sparking?",
                        "field_key": "power_scope_sparking_wires",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_fallen_tree",
                "label": "سقوط شجرة أو عائق على الطريق",
                "english_label": "Fallen tree blocking road",
                "category": "سقوط شجرة / عائق طريق",
                "department_id": "dept_traffic",
                "keywords": ["سقوط شجرة", "شجرة وقعت", "شجرة قافلة", "عائق في الطريق", "fallen tree"],
                "actions": [
                    {"action_type": "categorize", "target_value": "سقوط شجرة / عائق طريق"},
                    {"action_type": "assign_department", "department_name": "المرور وهيئة النظافة والتجميل", "department_phone": "136"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_tree_1",
                        "order": 1,
                        "text": "الشجرة قافلة الطريق كله ولا حارة واحدة؟ وهل في عربيات اتخبطت أو حد اتصاب؟",
                        "english_text": "Is the tree blocking the whole road or one lane? Were any cars struck or persons injured?",
                        "field_key": "tree_lanes_injuries",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_rain_flood",
                "label": "تجمع مياه أمطار وغرق شوارع",
                "english_label": "Rainwater flooding and stalled vehicles",
                "category": "تجمع أمطار / مياه وسيول",
                "department_id": "dept_civil_defense",
                "keywords": ["مياه أمطار", "غرق الشارع", "الشارع بقى بحر", "تجمع مياه", "عربيات غرقانة", "flooding", "rainwater"],
                "actions": [
                    {"action_type": "categorize", "target_value": "تجمع أمطار / مياه وسيول"},
                    {"action_type": "assign_department", "department_name": "شركة الصرف الصحي والحماية المدنية", "department_phone": "175"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_flood_1",
                        "order": 1,
                        "text": "المياه وصلت لارتفاع قد إيه تقريباً؟ وهل في عربيات عطلت أو أسر محاصرة في المياه؟",
                        "english_text": "What is the approximate water height? Have vehicles stalled or families trapped inside cars?",
                        "field_key": "flood_water_height_trapped",
                        "is_required": True,
                        "options": []
                    }
                ]
            },
            {
                "id": "opt_ambulance_critical",
                "label": "طلب سيارة إسعاف وحالة حرجة",
                "english_label": "Critical medical ambulance request",
                "category": "حالة حرجة / إسعاف طارئ",
                "department_id": "dept_ambulance",
                "keywords": ["إسعاف", "اسعاف", "والدي تعبان", "حالة حرجة", "مش قادر يتنفس", "ألم في صدره", "تعبان جدا", "ambulance", "medical emergency"],
                "actions": [
                    {"action_type": "categorize", "target_value": "حالة حرجة / إسعاف طارئ"},
                    {"action_type": "assign_department", "department_name": "هيئة الإسعاف المصرية", "department_phone": "123"},
                    {"action_type": "outbound_call", "target_value": "123", "department_name": "هيئة الإسعاف المصرية", "department_phone": "123"}
                ],
                "sub_questions": [
                    {
                        "id": "sq_med_1",
                        "order": 1,
                        "text": "المريض عنده كام سنة وإيه الأعراض اللي حاسس بيها؟ وهل واعي وبيتكلم؟",
                        "english_text": "How old is the patient, what symptoms is he experiencing, and is he conscious and speaking?",
                        "field_key": "patient_age_symptoms_consciousness",
                        "is_required": True,
                        "options": []
                    },
                    {
                        "id": "sq_med_2",
                        "order": 2,
                        "text": "الحالة بدأت من إمتى؟ وخليك جنبه واتبع تعليمات المسعف وجاري تحريك سيارة الإسعاف فوراً.",
                        "english_text": "When did this onset begin? Stay by his side, ambulance is being dispatched immediately.",
                        "field_key": "medical_onset_duration",
                        "is_required": True,
                        "options": []
                    }
                ]
            }
        ]
    }
]

print(f"Generated {len(SCENARIOS_QUESTIONS)} top-level questions.")
print(f"Option count for Question 4: {len(SCENARIOS_QUESTIONS[3]['options'])}")
sub_q_total = sum(len(opt.get('sub_questions', [])) for opt in SCENARIOS_QUESTIONS[3]['options'])
print(f"Total sub-questions across all 20 scenarios: {sub_q_total}")
