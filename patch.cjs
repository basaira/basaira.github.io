const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the old Select block
const oldSelectBlock = `                        <div>
                            <label class="block text-white/90 text-sm font-bold mb-2">
                                <span class="lang-ar">المسار المطلوب</span>
                                <span class="lang-en">Desired Track</span>
                                <span class="lang-fr">Parcours Souhaité</span>
                                <span class="lang-ru">Желаемый курс</span>
                            </label>
                            <select name="track" required class="w-full bg-[#0A1F44] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all">
                                <option value="" disabled selected class="lang-ar">-- اختر المسار --</option>
                                <option value="" disabled selected class="lang-en">-- Select Track --</option>
                                <option value="" disabled selected class="lang-fr">-- Choisir le Parcours --</option>
                                <option value="" disabled selected class="lang-ru">-- Выберите курс --</option>

                                <option value="Quran and Tajweed" class="lang-ar">مسار حفظ القرآن وإتقان التجويد</option>
                                <option value="Quran and Tajweed" class="lang-en">Track of Quran Memorization & Tajweed</option>
                                <option value="Quran and Tajweed" class="lang-fr">Parcours de Mémorisation du Coran</option>
                                <option value="Quran and Tajweed" class="lang-ru">Путь заучивания Корана</option>

                                <option value="Arabic from Scratch" class="lang-ar">دورة اللغة العربية من الصفر</option>
                                <option value="Arabic from Scratch" class="lang-en">Arabic Language from Scratch</option>
                                <option value="Arabic from Scratch" class="lang-fr">Langue Arabe de Zéro</option>
                                <option value="Arabic from Scratch" class="lang-ru">Арабский язык с нуля</option>

                                <option value="Specialization" class="lang-ar">التخصص اللغوي وعلوم الآلة</option>
                                <option value="Specialization" class="lang-en">Linguistic Specialization & Instrumental</option>
                                <option value="Specialization" class="lang-fr">Spécialisation Linguistique</option>
                                <option value="Specialization" class="lang-ru">Лингвистическая специализация</option>
                            </select>
                        </div>`;

const newSelectBlock = `                        <!-- تم حل المشكلة: فصل قوائم الاختيار حسب اللغة -->
                        <div class="lang-ar">
                            <label class="block text-white/90 text-sm font-bold mb-2">المسار المطلوب</label>
                            <select name="track_ar" class="w-full bg-[#0A1F44] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all">
                                <option value="" disabled selected>-- اختر المسار --</option>
                                <option value="Quran and Tajweed">مسار حفظ القرآن وإتقان التجويد</option>
                                <option value="Arabic from Scratch">دورة اللغة العربية من الصفر</option>
                                <option value="Specialization">التخصص اللغوي وعلوم الآلة</option>
                            </select>
                        </div>
                        <div class="lang-en">
                            <label class="block text-white/90 text-sm font-bold mb-2">Desired Track</label>
                            <select name="track_en" class="w-full bg-[#0A1F44] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all">
                                <option value="" disabled selected>-- Select Track --</option>
                                <option value="Quran and Tajweed">Track of Quran Memorization & Tajweed</option>
                                <option value="Arabic from Scratch">Arabic Language from Scratch</option>
                                <option value="Specialization">Linguistic Specialization & Instrumental</option>
                            </select>
                        </div>
                        <div class="lang-fr">
                            <label class="block text-white/90 text-sm font-bold mb-2">Parcours Souhaité</label>
                            <select name="track_fr" class="w-full bg-[#0A1F44] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all">
                                <option value="" disabled selected>-- Choisir le Parcours --</option>
                                <option value="Quran and Tajweed">Parcours de Mémorisation du Coran</option>
                                <option value="Arabic from Scratch">Langue Arabe de Zéro</option>
                                <option value="Specialization">Spécialisation Linguistique</option>
                            </select>
                        </div>
                        <div class="lang-ru">
                            <label class="block text-white/90 text-sm font-bold mb-2">Желаемый курс</label>
                            <select name="track_ru" class="w-full bg-[#0A1F44] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all">
                                <option value="" disabled selected>-- Выберите курс --</option>
                                <option value="Quran and Tajweed">Путь заучивания Корана</option>
                                <option value="Arabic from Scratch">Арабский язык с нуля</option>
                                <option value="Specialization">Лингвистическая специализация</option>
                            </select>
                        </div>`;

html = html.replace(oldSelectBlock, newSelectBlock);

// 2. Add shadow class to submit btn
html = html.replace(
    'class="w-full bg-[#D4AF37] text-[#0A1F44] font-black py-4 rounded-xl hover:bg-white transition-all flex justify-center items-center gap-2 mt-2"',
    'class="w-full bg-[#D4AF37] text-[#0A1F44] font-black py-4 rounded-xl hover:bg-white transition-all flex justify-center items-center gap-2 mt-2 shadow-[0_0_20px_rgba(212,175,55,0.4)]"'
);

// 3. The slider track section needs duplicating the cards
// Using string split and replace
const trackStartStr = '<div id="testimonials-track" class="slider-track flex gap-8 w-max">';
const trackEndStr = `                        </div>
                    </div>`;

const parts = html.split(trackStartStr);
if (parts.length > 1) {
    let secondPart = parts[1];
    let trackInnerEnd = secondPart.indexOf(trackEndStr) + 30;
    
    // We replace the whole track
    const newTrackHTML = `<div class="slider-track">
                        
                        <!-- المجموعة الأولى من الآراء -->
                        <div class="flex gap-8 px-4">
                            
                            <!-- الرأي 1 -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col h-full">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"الحَمْدُ للهِ، لَقَدْ وَجَدْتُ جَمِيعَ الحِصَصِ مُفِيدَةً جِدًّا؛ وَكَانَ أَكْثَرُ الجَوَانِبِ نَفْعًا مُسَاعَدَةُ ابْنِي عَلَى قِرَاءَةِ القُرْآنِ قِرَاءَةً صَحِيحَةً مَعَ اتِّبَاعِ قَوَاعِدِ التَّجْوِيدِ السَّلِيمَةِ وَتَجْوِيدِ فَهْمِهِ لَهَا. كَمَا أُقَدِّرُ عَالِيًا مَا يُبْذَلُ مِنْ تَشْجِيعٍ وَصَبْرٍ، وَمَا يُوَفَّرُ مِنْ بِيئَةٍ تَعْلِيمِيَّةٍ إِيجَابِيَّةٍ، مِمَّا سَاعَدَ فِي بِنَاءِ ثِقَتِهِ بِنَفْسِهِ وَتَعْمِيقِ صِلَتِهِ بِالقُرْآنِ."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-100 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">O</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">والدة الطالب عمر (أمريكا)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن والتجويد</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Alhamdulillah, I have found all of the sessions beneficial. The most beneficial aspect has been helping him read the Quran correctly while following the proper Tajweed rules and improving his understanding of them. I also appreciate the encouragement, patience, and positive learning environment, which have helped build his confidence and connection with the Quran."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-100 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">O</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Omar's Mother (USA)</h4>
                                            <p class="text-sm text-gray-500">Quran & Tajweed Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Dieu soit loué, j'ai trouvé toutes les séances très bénéfiques. L'aspect le plus utile a été d'aider mon fils à lire le Coran correctement en suivant les règles de Tajwid. J'apprécie également la patience et l'environnement d'apprentissage positif."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-100 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">O</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Mère d'Omar (USA)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran & Tajwid</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Альхамдулиллях, я нашла все занятия очень полезными. Самым важным была помощь моему сыну в правильном чтении Корана с соблюдением правил таджвида. Я также ценю терпение и позитивную среду обучения."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-100 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">O</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Мать Омара (США)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана и Таджвида</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- الرأي 2 -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"لَقَدْ وَجَدْتُ الحِصَصَ نَافِعَةً لِلْغَايَةِ، وَلَا سِيَّمَا فِي تَحْسِينِ تَجْوِيدِي، وَتَصْوِيبِ أَخْطَائِي، وَبِنَاءِ الِاسْتِمْرَارِيَّةِ فِي تِلَاوَتِي. كَمَا أُقَدِّرُ شُرُوحَاتِكُمُ الجَلِيَّةَ وَصَبْرَكُمْ، مِمَّا يُعِينُنِي عَلَى البَقَاءِ أَكْثَرَ اسْتِحْضَارًا وَتَرْكِيزًا عِنْدَ القِرَاءَةِ."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">M</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">محمد (السويد)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"I’ve found the sessions very beneficial, especially for improving my Tajweed, correcting mistakes, and building consistency in my recitation. I also appreciate your clear explanations and patience, which help me stay more mindful when reading."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">M</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Mohammed (Sweden)</h4>
                                            <p class="text-sm text-gray-500">Quran Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"J'ai trouvé les séances extrêmement bénéfiques, en particulier pour améliorer mon Tajwid et corriger mes erreurs. J'apprécie également vos explications claires et votre patience."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">M</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Mohammed (Suède)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Я нашел занятия чрезвычайно полезными, особенно для улучшения моего таджвида и исправления ошибок. Я также ценю ваши ясные объяснения и ваше терпение."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">M</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Мохаммед (Швеция)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- الرأي 3 -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"بِشَكْلٍ عَامٍّ، أَعْتَقِدُ أَنَّ الحِصَصَ كَانَتْ نَافِعَةً جَمِيعُهَا فِي تَحْسِينِ لُغَتِي العَرَبِيَّةِ، وَلَيْسَ لَدَيَّ أَيُّ اعْتِرَاضٍ. وَأَجِدُ تِلَاوَةَ السُّوَرِ مُفِيدَةً نَفْعًا عَظِيمًا."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">I</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">إدريس (بريطانيا)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن واللغة العربية</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Overall, I believe they have all been beneficial in improving my Arabic and I do not have any objections. I mostly find the Surah recitation very beneficial."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">I</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Idrees (UK)</h4>
                                            <p class="text-sm text-gray-500">Quran & Arabic Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Dans l'ensemble, je pense que toutes les séances ont été bénéfiques pour améliorer mon arabe. Je trouve la récitation des sourates particulièrement utile."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">I</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Idrees (Royaume-Uni)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran & Arabe</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"В целом, я считаю, что все занятия были полезны для улучшения моего арабского языка. Я нахожу чтение сур чрезвычайно полезным."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">I</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Идрис (Великобритания)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана и Арабского</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- الرأي 4 -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"إِنَّ أَكْثَرَ الجَوَانِبِ الَّتِي وَجَدْتُهَا نَافِعَةً هِيَ المُرَاجَعَةُ؛ فَعَادَةً لَا يَتَّسِعُ وَقْتِي لِلْمُرَاجَعَةِ بِمُفْرَدِي، وَلَكِنِ الحَمْدُ للهِ، يَتِمُّ تَدْرِيبِي وَتَصْوِيبُ أَخْطَائِي بِشَكْلٍ سَلِيمٍ خِلَالَ الحِصَّةِ."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#0A1F44]/10 rounded-full flex items-center justify-center text-[#0A1F44] font-bold text-xl shrink-0">A</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">عظيم (أمريكا)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"One aspect I found most beneficial is reviewing. I usually don’t have much time to review on my own time but alhamdulillah I am properly trained and corrected during class."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#0A1F44]/10 rounded-full flex items-center justify-center text-[#0A1F44] font-bold text-xl shrink-0">A</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Azeem (USA)</h4>
                                            <p class="text-sm text-gray-500">Quran Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"L'aspect le plus bénéfique est la révision. Je n'ai pas beaucoup de temps pour réviser seul, mais Dieu soit loué, je suis bien entraîné pendant les cours."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#0A1F44]/10 rounded-full flex items-center justify-center text-[#0A1F44] font-bold text-xl shrink-0">A</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Azeem (États-Unis)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Наиболее полезным аспектом является повторение. У меня мало времени для самостоятельных занятий, но на уроках меня правильно обучают и исправляют."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#0A1F44]/10 rounded-full flex items-center justify-center text-[#0A1F44] font-bold text-xl shrink-0">A</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Азим (США)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- الرأي 5 -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"تَعَلَّمْنَا مِنْكَ أَشْيَاءَ كَثِيرَةً! لَيْسَ القُرْآنَ فَحْسَبُ، بَلْ حُسْنَ الخُلُقِ وَالرِّفْقَ."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">S</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">شمس (آسيا)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"We have learned so many things from you! Not only the Quran, but also good character and gentleness."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">S</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Shams (Asia)</h4>
                                            <p class="text-sm text-gray-500">Quran Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Nous avons appris énormément de choses de vous ! Pas seulement le Coran, mais aussi les bonnes manières et la douceur."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">S</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Shams (Asie)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Мы многому у вас научились! Не только Корану, но и благонравию и мягкости."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">S</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Шамс (Азия)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        </div>

                        <!-- المجموعة الثانية المستنسخة (لضمان الانزلاق المستمر بدون تقطيع) -->
                        <div class="flex gap-8 px-4" aria-hidden="true">
                            
                            <!-- الرأي 1 (مستنسخ) -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col h-full">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"الحَمْدُ للهِ، لَقَدْ وَجَدْتُ جَمِيعَ الحِصَصِ مُفِيدَةً جِدًّا؛ وَكَانَ أَكْثَرُ الجَوَانِبِ نَفْعًا مُسَاعَدَةُ ابْنِي عَلَى قِرَاءَةِ القُرْآنِ قِرَاءَةً صَحِيحَةً مَعَ اتِّبَاعِ قَوَاعِدِ التَّجْوِيدِ السَّلِيمَةِ وَتَجْوِيدِ فَهْمِهِ لَهَا. كَمَا أُقَدِّرُ عَالِيًا مَا يُبْذَلُ مِنْ تَشْجِيعٍ وَصَبْرٍ، وَمَا يُوَفَّرُ مِنْ بِيئَةٍ تَعْلِيمِيَّةٍ إِيجَابِيَّةٍ، مِمَّا سَاعَدَ فِي بِنَاءِ ثِقَتِهِ بِنَفْسِهِ وَتَعْمِيقِ صِلَتِهِ بِالقُرْآنِ."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-100 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">O</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">والدة الطالب عمر (أمريكا)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن والتجويد</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Alhamdulillah, I have found all of the sessions beneficial. The most beneficial aspect has been helping him read the Quran correctly while following the proper Tajweed rules and improving his understanding of them. I also appreciate the encouragement, patience, and positive learning environment, which have helped build his confidence and connection with the Quran."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-100 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">O</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Omar's Mother (USA)</h4>
                                            <p class="text-sm text-gray-500">Quran & Tajweed Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Dieu soit loué, j'ai trouvé toutes les séances très bénéfiques. L'aspect le plus utile a été d'aider mon fils à lire le Coran correctement en suivant les règles de Tajwid. J'apprécie également la patience et l'environnement d'apprentissage positif."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-100 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">O</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Mère d'Omar (USA)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran & Tajwid</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Альхамдулиллях, я нашла все занятия очень полезными. Самым важным была помощь моему сыну в правильном чтении Корана с соблюдением правил таджвида. Я также ценю терпение и позитивную среду обучения."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-100 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">O</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Мать Омара (США)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана и Таджвида</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- الرأي 2 (مستنسخ) -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"لَقَدْ وَجَدْتُ الحِصَصَ نَافِعَةً لِلْغَايَةِ، وَلَا سِيَّمَا فِي تَحْسِينِ تَجْوِيدِي، وَتَصْوِيبِ أَخْطَائِي، وَبِنَاءِ الِاسْتِمْرَارِيَّةِ فِي تِلَاوَتِي. كَمَا أُقَدِّرُ شُرُوحَاتِكُمُ الجَلِيَّةَ وَصَبْرَكُمْ، مِمَّا يُعِينُنِي عَلَى البَقَاءِ أَكْثَرَ اسْتِحْضَارًا وَتَرْكِيزًا عِنْدَ القِرَاءَةِ."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">M</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">محمد (السويد)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"I’ve found the sessions very beneficial, especially for improving my Tajweed, correcting mistakes, and building consistency in my recitation. I also appreciate your clear explanations and patience, which help me stay more mindful when reading."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">M</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Mohammed (Sweden)</h4>
                                            <p class="text-sm text-gray-500">Quran Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"J'ai trouvé les séances extrêmement bénéfiques, en particulier pour améliorer mon Tajwid et corriger mes erreurs. J'apprécie également vos explications claires et votre patience."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">M</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Mohammed (Suède)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Я нашел занятия чрезвычайно полезными, особенно для улучшения моего таджвида и исправления ошибок. Я также ценю ваши ясные объяснения и ваше терпение."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">M</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Мохаммед (Швеция)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- الرأي 3 (مستنسخ) -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"بِشَكْلٍ عَامٍّ، أَعْتَقِدُ أَنَّ الحِصَصَ كَانَتْ نَافِعَةً جَمِيعُهَا فِي تَحْسِينِ لُغَتِي العَرَبِيَّةِ، وَلَيْسَ لَدَيَّ أَيُّ اعْتِرَاضٍ. وَأَجِدُ تِلَاوَةَ السُّوَرِ مُفِيدَةً نَفْعًا عَظِيمًا."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">I</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">إدريس (بريطانيا)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن واللغة العربية</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Overall, I believe they have all been beneficial in improving my Arabic and I do not have any objections. I mostly find the Surah recitation very beneficial."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">I</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Idrees (UK)</h4>
                                            <p class="text-sm text-gray-500">Quran & Arabic Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Dans l'ensemble, je pense que toutes les séances ont été bénéfiques pour améliorer mon arabe. Je trouve la récitation des sourates particulièrement utile."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">I</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Idrees (Royaume-Uni)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran & Arabe</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"В целом, я считаю, что все занятия были полезны для улучшения моего арабского языка. Я нахожу чтение сур чрезвычайно полезным."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xl shrink-0">I</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Идрис (Великобритания)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана и Арабского</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- الرأي 4 (مستنسخ) -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"إِنَّ أَكْثَرَ الجَوَانِبِ الَّتِي وَجَدْتُهَا نَافِعَةً هِيَ المُرَاجَعَةُ؛ فَعَادَةً لَا يَتَّسِعُ وَقْتِي لِلْمُرَاجَعَةِ بِمُفْرَدِي، وَلَكِنِ الحَمْدُ للهِ، يَتِمُّ تَدْرِيبِي وَتَصْوِيبُ أَخْطَائِي بِشَكْلٍ سَلِيمٍ خِلَالَ الحِصَّةِ."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#0A1F44]/10 rounded-full flex items-center justify-center text-[#0A1F44] font-bold text-xl shrink-0">A</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">عظيم (أمريكا)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"One aspect I found most beneficial is reviewing. I usually don’t have much time to review on my own time but alhamdulillah I am properly trained and corrected during class."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#0A1F44]/10 rounded-full flex items-center justify-center text-[#0A1F44] font-bold text-xl shrink-0">A</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Azeem (USA)</h4>
                                            <p class="text-sm text-gray-500">Quran Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"L'aspect le plus bénéfique est la révision. Je n'ai pas beaucoup de temps pour réviser seul, mais Dieu soit loué, je suis bien entraîné pendant les cours."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#0A1F44]/10 rounded-full flex items-center justify-center text-[#0A1F44] font-bold text-xl shrink-0">A</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Azeem (États-Unis)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Наиболее полезным аспектом является повторение. У меня мало времени для самостоятельных занятий, но на уроках меня правильно обучают и исправляют."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#0A1F44]/10 rounded-full flex items-center justify-center text-[#0A1F44] font-bold text-xl shrink-0">A</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Азим (США)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- الرأي 5 (مستنسخ) -->
                            <div class="w-[320px] md:w-[400px] shrink-0 bg-white p-8 rounded-2xl border border-[#D4AF37]/20 shadow-sm relative flex flex-col">
                                <div class="lang-ar flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"تَعَلَّمْنَا مِنْكَ أَشْيَاءَ كَثِيرَةً! لَيْسَ القُرْآنَ فَحْسَبُ، بَلْ حُسْنَ الخُلُقِ وَالرِّفْقَ."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">S</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">شمس (آسيا)</h4>
                                            <p class="text-sm text-gray-500">مسار القرآن</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-en flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"We have learned so many things from you! Not only the Quran, but also good character and gentleness."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">S</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Shams (Asia)</h4>
                                            <p class="text-sm text-gray-500">Quran Track</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-fr flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Nous avons appris énormément de choses de vous ! Pas seulement le Coran, mais aussi les bonnes manières et la douceur."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">S</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Shams (Asie)</h4>
                                            <p class="text-sm text-gray-500">Parcours Coran</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="lang-ru flex-1 flex flex-col">
                                    <p class="text-[#0A1F44] italic mb-8 font-medium leading-relaxed flex-1">"Мы многому у вас научились! Не только Корану, но и благонравию и мягкости."</p>
                                    <div class="flex items-center gap-4 pt-4 border-t border-gray-200 mt-auto">
                                        <div class="w-12 h-12 bg-[#00563F]/10 rounded-full flex items-center justify-center text-[#00563F] font-bold text-xl shrink-0">S</div>
                                        <div>
                                            <h4 class="font-black text-[#0A1F44]">Шамс (Азия)</h4>
                                            <p class="text-sm text-gray-500">Курс Корана</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        </div>

                    </div>
                </div>`;

    let restHTML = html.substring(0, html.indexOf(trackStartStr)) + newTrackHTML + html.substring(html.indexOf(trackEndStr) + trackEndStr.length);
    html = restHTML;
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html');
