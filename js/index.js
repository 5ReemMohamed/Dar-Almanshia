document.addEventListener("DOMContentLoaded", function () {

    if (typeof AOS !== "undefined") {
        AOS.init({
            duration: 900,
            easing: "ease-out-cubic",
            once: true,
            offset: 80
        });
    }

    const gregorianDate =
        document.getElementById("gregorianDate");

    const hijriDate =
        document.getElementById("hijriDate");

    const sunriseTime =
        document.getElementById("sunriseTime");

    const sunsetTime =
        document.getElementById("sunsetTime");

    const fajrTime =
        document.getElementById("fajrTime");


    let prayerTimes = null;
    let prayerApiDate = null;
    let prayerRequestController = null;


    const CITY = "Mansoura";
    const COUNTRY = "Egypt";

    const CALCULATION_METHOD = 5;
    const SCHOOL = 0;


    function getToday() {
        return new Date();
    }


    function getApiDate() {

        const today = getToday();

        const day =
            String(today.getDate()).padStart(2, "0");

        const month =
            String(today.getMonth() + 1).padStart(2, "0");

        const year =
            today.getFullYear();

        return `${day}-${month}-${year}`;
    }


    function updateDates() {

        const today = getToday();

        if (gregorianDate) {

            const gregorian =
                new Intl.DateTimeFormat(
                    "ar-EG",
                    {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                ).format(today);

            gregorianDate.textContent =
                gregorian;
        }


        if (hijriDate) {

            const hijri =
                new Intl.DateTimeFormat(
                    "ar-SA-u-ca-islamic",
                    {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                ).format(today);

            hijriDate.textContent =
                hijri;
        }

    }


    function formatTime(time) {

        if (!time) {
            return "--:--";
        }

        const cleanTime =
            time
                .toString()
                .trim()
                .substring(0, 5);

        const parts =
            cleanTime.split(":");

        if (parts.length !== 2) {
            return "--:--";
        }

        const hours =
            Number(parts[0]);

        const minutes =
            Number(parts[1]);

        if (
            Number.isNaN(hours) ||
            Number.isNaN(minutes)
        ) {
            return "--:--";
        }

        const date =
            new Date();

        date.setHours(
            hours,
            minutes,
            0,
            0
        );

        return new Intl.DateTimeFormat(
            "ar-EG",
            {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            }
        ).format(date);

    }


    function updateTopbarPrayerTimes() {

        if (!prayerTimes) {
            return;
        }

        if (fajrTime) {

            fajrTime.textContent =
                formatTime(
                    prayerTimes.Fajr
                );
        }

        if (sunriseTime) {

            sunriseTime.textContent =
                formatTime(
                    prayerTimes.Sunrise
                );
        }

        if (sunsetTime) {

            sunsetTime.textContent =
                formatTime(
                    prayerTimes.Sunset
                );
        }

    }


    function updatePrayerCards() {

        if (!prayerTimes) {
            return;
        }

        const prayerMap = {

            fajr:
                prayerTimes.Fajr,

            dhuhr:
                prayerTimes.Dhuhr,

            asr:
                prayerTimes.Asr,

            maghrib:
                prayerTimes.Maghrib,

            isha:
                prayerTimes.Isha

        };


        Object.keys(prayerMap).forEach(
            function (prayerName) {

                const card =
                    document.querySelector(
                        `.prayer-card[data-prayer="${prayerName}"]`
                    );

                if (!card) {
                    return;
                }

                const timeElement =
                    card.querySelector(".prayer-time") ||
                    card.querySelector(".time") ||
                    card.querySelector("strong");

                if (timeElement) {

                    timeElement.textContent =
                        formatTime(
                            prayerMap[prayerName]
                        );

                }

            }
        );

    }


    async function getPrayerTimes(force = false) {

        const apiDate =
            getApiDate();

        if (
            !force &&
            prayerApiDate === apiDate &&
            prayerTimes
        ) {
            return;
        }

        if (prayerRequestController) {
            prayerRequestController.abort();
        }

        prayerRequestController =
            new AbortController();

        try {

            const url =
                `https://api.aladhan.com/v1/timingsByCity/${apiDate}` +
                `?city=${encodeURIComponent(CITY)}` +
                `&country=${encodeURIComponent(COUNTRY)}` +
                `&method=${CALCULATION_METHOD}` +
                `&school=${SCHOOL}`;


            const response =
                await fetch(
                    url,
                    {
                        method: "GET",
                        cache: "no-store",
                        signal:
                            prayerRequestController.signal,
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Prayer API Error: ${response.status}`
                );

            }


            const data =
                await response.json();


            if (
                data.code !== 200 ||
                !data.data ||
                !data.data.timings
            ) {

                throw new Error(
                    "Invalid prayer times data"
                );

            }


            prayerTimes =
                data.data.timings;

            prayerApiDate =
                apiDate;


            updatePrayerCards();

            updateTopbarPrayerTimes();

            updateCurrentPrayer();


            console.log(
                "Prayer times updated successfully:",
                prayerTimes
            );

        }
        catch (error) {

            if (
                error.name === "AbortError"
            ) {
                return;
            }

            console.error(
                "Failed to load prayer times:",
                error
            );

        }
        finally {

            prayerRequestController =
                null;

        }

    }


    function convertTimeToMinutes(time) {

        if (!time) {
            return null;
        }

        const cleanTime =
            time
                .toString()
                .trim()
                .substring(0, 5);

        const parts =
            cleanTime
                .split(":")
                .map(Number);

        if (
            parts.length !== 2 ||
            Number.isNaN(parts[0]) ||
            Number.isNaN(parts[1])
        ) {
            return null;
        }

        return (
            parts[0] * 60 +
            parts[1]
        );

    }


    function updateCurrentPrayer() {

        if (!prayerTimes) {
            return;
        }

        const now =
            new Date();

        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();


        const prayerCards =
            document.querySelectorAll(
                ".prayer-card"
            );


        prayerCards.forEach(
            function (card) {

                card.classList.remove(
                    "active"
                );

            }
        );


        const prayers = [

            {
                name: "fajr",
                start: prayerTimes.Fajr
            },

            {
                name: "dhuhr",
                start: prayerTimes.Dhuhr
            },

            {
                name: "asr",
                start: prayerTimes.Asr
            },

            {
                name: "maghrib",
                start: prayerTimes.Maghrib
            },

            {
                name: "isha",
                start: prayerTimes.Isha
            }

        ];


        let currentPrayer =
            null;


        for (
            let i = 0;
            i < prayers.length;
            i++
        ) {

            const currentStart =
                convertTimeToMinutes(
                    prayers[i].start
                );


            if (
                currentStart === null
            ) {
                continue;
            }


            const nextPrayer =
                prayers[i + 1];


            if (nextPrayer) {

                const nextStart =
                    convertTimeToMinutes(
                        nextPrayer.start
                    );


                if (
                    nextStart !== null &&
                    currentMinutes >= currentStart &&
                    currentMinutes < nextStart
                ) {

                    currentPrayer =
                        prayers[i].name;

                    break;

                }

            }
            else {

                if (
                    currentMinutes >=
                    currentStart
                ) {

                    currentPrayer =
                        "isha";

                }

            }

        }


        if (!currentPrayer) {

            const fajrStart =
                convertTimeToMinutes(
                    prayerTimes.Fajr
                );

            if (
                fajrStart !== null &&
                currentMinutes < fajrStart
            ) {

                currentPrayer =
                    "isha";

            }

        }


        if (currentPrayer) {

            const activeCard =
                document.querySelector(
                    `.prayer-card[data-prayer="${currentPrayer}"]`
                );

            if (activeCard) {

                activeCard.classList.add(
                    "active"
                );

            }

        }

    }


    const navbar =
        document.querySelector(
            ".dar-navbar"
        );


    function handleNavbarScroll() {

        if (!navbar) {
            return;
        }

        if (window.scrollY > 50) {

            navbar.classList.add(
                "dar-navbar-scrolled"
            );

        }
        else {

            navbar.classList.remove(
                "dar-navbar-scrolled"
            );

        }

    }


    window.addEventListener(
        "scroll",
        handleNavbarScroll
    );


    handleNavbarScroll();


    const navLinks =
        document.querySelectorAll(
            ".dar-nav-menu .nav-link:not(.dropdown-toggle)"
        );


    const navCollapse =
        document.getElementById(
            "darNavbar"
        );


    navLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    if (
                        window.innerWidth < 992 &&
                        navCollapse &&
                        navCollapse.classList.contains("show")
                    ) {

                        if (
                            typeof bootstrap !== "undefined"
                        ) {

                            const bsCollapse =
                                bootstrap.Collapse.getInstance(
                                    navCollapse
                                );

                            if (bsCollapse) {

                                bsCollapse.hide();

                            }

                        }

                    }

                }
            );

        }
    );


    const aboutContent =
        document.querySelector(
            ".about-content"
        );


    const aboutVisual =
        document.querySelector(
            ".about-visual"
        );


    const scrollTop =
        document.getElementById(
            "aboutScrollTop"
        );


    function revealAbout() {

        const section =
            document.querySelector(
                ".about-dar-section"
            );

        if (!section) {
            return;
        }

        const sectionTop =
            section.getBoundingClientRect().top;

        const windowHeight =
            window.innerHeight;

        if (
            sectionTop <
            windowHeight - 100
        ) {

            if (aboutContent) {

                aboutContent.classList.add(
                    "active"
                );

            }

            if (aboutVisual) {

                setTimeout(
                    function () {

                        aboutVisual.classList.add(
                            "active"
                        );

                    },
                    180
                );

            }

        }

    }


    revealAbout();


    window.addEventListener(
        "scroll",
        revealAbout
    );


    if (scrollTop) {

        scrollTop.addEventListener(
            "click",
            function () {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    const cards =
        document.querySelectorAll(
            ".dar-pillar-card"
        );


    cards.forEach(
        function (card, index) {

            card.style.opacity = "0";

            card.style.transform =
                "translateY(35px)";

            setTimeout(
                function () {

                    card.style.transition =
                        "opacity .6s ease, transform .6s ease";

                    card.style.opacity =
                        "1";

                    card.style.transform =
                        "translateY(0)";

                },
                index * 120
            );

        }
    );


    const images =
        document.querySelectorAll(
            ".dar-pillar-image img"
        );


    images.forEach(
        function (image) {

            image.addEventListener(
                "error",
                function () {

                    this.style.display =
                        "none";

                    this.parentElement.classList.add(
                        "image-error"
                    );

                }
            );

        }
    );


    const serviceItems =
        document.querySelectorAll(
            ".dar-service-item"
        );


    const centerFrame =
        document.querySelector(
            ".dar-center-frame"
        );


    serviceItems.forEach(
        function (item, index) {

            item.style.opacity = "0";

            item.style.transform =
                "translateY(25px)";

            item.style.transition =
                `opacity .7s ease ${index * 0.15}s,
                 transform .7s ease ${index * 0.15}s`;

        }
    );


    if (centerFrame) {

        centerFrame.style.opacity =
            "0";

        centerFrame.style.transform =
            "scale(.92)";

        centerFrame.style.transition =
            "opacity .8s ease, transform .8s ease";

    }


    const servicesSection =
        document.querySelector(
            ".dar-services-section"
        );


    if (
        servicesSection &&
        typeof IntersectionObserver !== "undefined"
    ) {

        const servicesObserver =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(
                        function (entry) {

                            if (
                                entry.isIntersecting
                            ) {

                                serviceItems.forEach(
                                    function (item) {

                                        item.style.opacity =
                                            "1";

                                        item.style.transform =
                                            "translateY(0)";

                                    }
                                );


                                if (centerFrame) {

                                    centerFrame.style.opacity =
                                        "1";

                                    centerFrame.style.transform =
                                        "scale(1)";

                                }


                                servicesObserver.unobserve(
                                    entry.target
                                );

                            }

                        }
                    );

                },
                {
                    threshold: 0.15
                }
            );


        servicesObserver.observe(
            servicesSection
        );

    }


    const breaker =
        document.querySelector(
            ".section-breaker-box"
        );


    if (
        breaker &&
        typeof IntersectionObserver !== "undefined"
    ) {

        const breakerObserver =
            new IntersectionObserver(
                function (entries) {

                    if (
                        entries[0].isIntersecting
                    ) {

                        breaker.classList.add(
                            "show"
                        );

                        breakerObserver.unobserve(
                            breaker
                        );

                    }

                },
                {
                    threshold: 0.2
                }
            );


        breakerObserver.observe(
            breaker
        );

    }


    updateDates();

    getPrayerTimes(true);


    setInterval(
        updateCurrentPrayer,
        60 * 1000
    );


    setInterval(
        updateDates,
        60 * 60 * 1000
    );


    let lastApiDate =
        getApiDate();


    setInterval(
        function () {

            const currentApiDate =
                getApiDate();


            if (
                currentApiDate !==
                lastApiDate
            ) {

                lastApiDate =
                    currentApiDate;

                updateDates();

                getPrayerTimes(true);

            }

        },
        60 * 1000
    );


});