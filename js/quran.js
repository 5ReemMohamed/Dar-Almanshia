document.addEventListener("DOMContentLoaded", function () {

    const API_BASE = "https://api.alquran.cloud/v1";

    const surahGrid = document.getElementById("surahGrid");
    const surahLoader = document.getElementById("surahLoader");

    const recitersGrid = document.getElementById("recitersGrid");
    const recitersLoader = document.getElementById("recitersLoader");

    const ayahImages = document.getElementById("ayahImages");
    const readingLoader = document.getElementById("readingLoader");

    const selectedSurahArabic =
        document.getElementById("selectedSurahArabic");

    const selectedSurahEnglish =
        document.getElementById("selectedSurahEnglish");

    const readingSurahName =
        document.getElementById("readingSurahName");

    const reciterModalTitle =
        document.getElementById("reciterModalTitle");

    const audioSurahName =
        document.getElementById("audioSurahName");

    const audioReciterName =
        document.getElementById("audioReciterName");

    const quranAudio =
        document.getElementById("quranAudio");

    const readSurahBtn =
        document.getElementById("readSurahBtn");

    const listenSurahBtn =
        document.getElementById("listenSurahBtn");

    let selectedSurah = null;

    let optionsModal = null;
    let recitersModal = null;
    let audioModal = null;
    let readingModal = null;


    function initModals() {

        optionsModal = new bootstrap.Modal(
            document.getElementById("surahOptionsModal")
        );

        recitersModal = new bootstrap.Modal(
            document.getElementById("recitersModal")
        );

        audioModal = new bootstrap.Modal(
            document.getElementById("audioModal")
        );

        readingModal = new bootstrap.Modal(
            document.getElementById("readingModal")
        );
    }


    async function loadSurahs() {

        try {

            const response =
                await fetch(`${API_BASE}/surah`);

            if (!response.ok) {
                throw new Error("Failed to load surahs");
            }

            const result =
                await response.json();

            renderSurahs(result.data);

        } catch (error) {

            console.error(error);

            surahGrid.innerHTML = `
                <div class="alert alert-danger text-center">
                    تعذر تحميل السور، حاول مرة أخرى.
                </div>
            `;

        } finally {

            surahLoader.style.display = "none";

        }
    }


    function renderSurahs(surahs) {

        surahGrid.innerHTML = "";

        surahs.forEach(surah => {

            const item =
                document.createElement("div");

            item.className =
                "dar-surah-item";

            item.innerHTML = `

                <div class="dar-surah-number">
                    <span>${surah.number}</span>
                </div>

                <div class="dar-surah-info">

                    <h5>
                        ${surah.englishName}
                    </h5>

                    <span>
                        ${surah.revelationType === "Meccan"
                            ? "مكية"
                            : "مدنية"}
                        ·
                        ${surah.numberOfAyahs}
                        آيات
                    </span>

                </div>

                <div class="dar-surah-arabic">
                    ${surah.name}
                </div>

                <div class="dar-surah-icon">
                    <i class="fa-solid fa-chevron-left"></i>
                </div>
            `;

            item.addEventListener(
                "click",
                function () {

                    openSurahOptions(surah);

                }
            );

            surahGrid.appendChild(item);

        });
    }


    function openSurahOptions(surah) {

        selectedSurah = surah;

        selectedSurahArabic.textContent =
            surah.name;

        selectedSurahEnglish.textContent =
            surah.englishName;

        optionsModal.show();

    }


    readSurahBtn.addEventListener(
        "click",
        async function () {

            if (!selectedSurah) {
                return;
            }

            optionsModal.hide();

            setTimeout(() => {

                readingSurahName.textContent =
                    selectedSurah.name;

                ayahImages.innerHTML = "";

                readingLoader.style.display =
                    "flex";

                readingModal.show();

                loadSurahReading(
                    selectedSurah.number
                );

            }, 300);

        }
    );


async function loadSurahReading(surahNumber) {

    try {

        const response = await fetch(
            `${API_BASE}/surah/${surahNumber}/quran-uthmani`
        );

        if (!response.ok) {
            throw new Error("Failed to load surah");
        }

        const result = await response.json();

        const ayahs = result.data.ayahs;

        ayahImages.innerHTML = `
            <div class="quran-page">

                <div class="quran-page-header">
                    <span class="quran-decoration">۞</span>

                    <h2>${result.data.name}</h2>

                    <span class="quran-decoration">۞</span>
                </div>

                ${
                    surahNumber !== 1 && surahNumber !== 9
                        ? `
                            <div class="bismillah">
                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </div>
                        `
                        : ""
                }

                <div class="quran-text">

                    ${ayahs.map(ayah => `
                        <span class="ayah">
                            ${ayah.text}
                            <span class="ayah-number">
                                ${ayah.numberInSurah}
                            </span>
                        </span>
                    `).join(" ")}

                </div>

            </div>
        `;

    } catch (error) {

        console.error(error);

        ayahImages.innerHTML = `
            <div class="alert alert-danger text-center">
                تعذر تحميل السورة، حاول مرة أخرى.
            </div>
        `;

    } finally {

        readingLoader.style.display = "none";

    }
}
    listenSurahBtn.addEventListener(
        "click",
        async function () {

            if (!selectedSurah) {
                return;
            }

            optionsModal.hide();

            setTimeout(() => {

                reciterModalTitle.textContent =
                    `${selectedSurah.name} - اختر القارئ`;

                recitersGrid.innerHTML = "";

                recitersLoader.style.display =
                    "flex";

                recitersModal.show();

                loadReciters();

            }, 300);

        }
    );


async function loadReciters() {

    recitersGrid.innerHTML = "";

    recitersLoader.style.display = "flex";

    try {

        const response = await fetch(
            `${API_BASE}/edition?format=audio&language=ar`
        );

        if (!response.ok) {
            throw new Error("Failed to load audio editions");
        }

        const result = await response.json();

        const editions = result.data || [];

        const uniqueEditions = [];

        const used = new Set();

        editions.forEach(edition => {

            if (!edition.identifier) {
                return;
            }

            if (used.has(edition.identifier)) {
                return;
            }

            used.add(edition.identifier);

            uniqueEditions.push(edition);

        });

        await checkRecitersAvailability(
            uniqueEditions
        );

    } catch (error) {

        console.error(error);

        recitersGrid.innerHTML = `
            <div class="dar-no-reciter">

                <i class="fa-solid fa-circle-exclamation"></i>

                <h5>
                    تعذر تحميل القراء
                </h5>

                <p>
                    حاول مرة أخرى لاحقًا.
                </p>

            </div>
        `;

    } finally {

        recitersLoader.style.display = "none";

    }

}
async function checkRecitersAvailability(reciters) {

    const validReciters = [];

    const checks = reciters.map(reciter => {

        return new Promise(resolve => {

            const audio = document.createElement("audio");

            const audioUrl =
                `https://cdn.islamic.network/quran/audio-surah/128/${reciter.identifier}/${selectedSurah.number}.mp3`;

            let finished = false;

            const finish = valid => {

                if (finished) {
                    return;
                }

                finished = true;

                audio.removeAttribute("src");
                audio.load();

                resolve({
                    valid,
                    reciter
                });

            };

            audio.preload = "metadata";

            audio.addEventListener(
                "loadedmetadata",
                function () {

                    finish(true);

                },
                {
                    once: true
                }
            );

            audio.addEventListener(
                "canplay",
                function () {

                    finish(true);

                },
                {
                    once: true
                }
            );

            audio.addEventListener(
                "error",
                function () {

                    finish(false);

                },
                {
                    once: true
                }
            );

            audio.src = audioUrl;

            setTimeout(() => {

                finish(false);

            }, 5000);

            audio.load();

        });

    });

    const results = await Promise.all(checks);

    results.forEach(result => {

        if (result.valid) {

            validReciters.push(
                result.reciter
            );

        }

    });

    renderReciters(validReciters);

}
function renderReciters(reciters) {

    recitersGrid.innerHTML = "";

    if (!reciters.length) {

        recitersGrid.innerHTML = `
            <div class="dar-no-reciter">

                <i class="fa-solid fa-microphone-slash"></i>

                <h5>
                    لا يوجد تسجيل متاح
                </h5>

                <p>
                    لا يوجد قارئ متاح لهذه السورة حاليًا.
                </p>

            </div>
        `;

        return;
    }

    reciters.forEach(reciter => {

        const card =
            document.createElement("div");

        card.className =
            "dar-reciter-card";

        const reciterName =
            reciter.name ||
            reciter.englishName ||
            reciter.identifier;

        card.innerHTML = `

            <div class="dar-reciter-icon">

                <i class="fa-solid fa-microphone"></i>

            </div>

            <div class="dar-reciter-info">

                <h5>
                    ${reciterName}
                </h5>

                <span>
                    ${reciter.englishName || "Quran Recitation"}
                </span>

            </div>

            <div class="dar-reciter-play">

                <i class="fa-solid fa-play"></i>

            </div>

        `;

        card.addEventListener(
            "click",
            function () {

                playSurah(
                    reciter.identifier,
                    reciterName
                );

            }
        );

        recitersGrid.appendChild(card);

    });

}

function playSurah(
    reciterIdentifier,
    reciterName
) {

    if (!selectedSurah) {
        return;
    }

    recitersModal.hide();

    const audioUrl =
        `https://cdn.islamic.network/quran/audio-surah/128/${reciterIdentifier}/${selectedSurah.number}.mp3`;

    audioSurahName.textContent =
        selectedSurah.name;

    audioReciterName.textContent =
        reciterName;

    quranAudio.src =
        audioUrl;

    setTimeout(() => {

        audioModal.show();

        quranAudio.play()
            .catch(() => {});

    }, 300);

}
    document
        .getElementById("audioModal")
        .addEventListener(
            "hidden.bs.modal",
            function () {

                quranAudio.pause();

                quranAudio.currentTime = 0;

                quranAudio.removeAttribute(
                    "src"
                );

                quranAudio.load();

            }
        );


    document
        .getElementById("readingModal")
        .addEventListener(
            "hidden.bs.modal",
            function () {

                ayahImages.innerHTML = "";

            }
        );


    initModals();

    loadSurahs();

});