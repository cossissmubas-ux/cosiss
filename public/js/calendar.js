"use strict";

/*
 * Temporary event data.
 *
 * Later, this array can be replaced with events fetched from:
 *
 * GET /api/events
 */
const events = [
    {
        id: 1,
        title: "Welcoming Function",
        date: "2026-08-07",
        time: "2:00 PM",
        location: "MUBAS Campus",
        category: "social",
        description:
            "An official welcome event introducing new and returning members to CoSISS, its vision, executive committee and opportunities available throughout the academic year.",
        registrationUrl: "/register.html"
    },
    {
        id: 2,
        title: "School Journey Ready Session",
        date: "2026-08-14",
        time: "2:00 PM",
        location: "MUBAS Campus",
        category: "workshop",
        description:
            "A guidance session designed to help students navigate university life, understand academic expectations and make the most of CoSISS programmes.",
        registrationUrl: "/register.html"
    },
    {
        id: 3,
        title: "Skill-Building Workshop",
        date: "2026-08-21",
        time: "9:00 AM",
        location: "Computer Laboratory",
        category: "workshop",
        description:
            "A practical technical workshop where students develop hands-on skills through demonstrations, collaborative activities and real-world problem solving.",
        registrationUrl: "/register.html"
    },
    {
        id: 4,
        title: "CoSISS Sports Gala",
        date: "2026-08-28",
        time: "9:00 AM",
        location: "MUBAS Sports Grounds",
        category: "social",
        description:
            "A two-day sports and recreation event promoting teamwork, networking, wellness and interaction among CoSISS members.",
        registrationUrl: "/register.html"
    },
    {
        id: 5,
        title: "Core Tech Talk",
        date: "2026-09-04",
        time: "9:00 AM",
        location: "Lecture Theatre",
        category: "meeting",
        description:
            "An industry-focused technology talk featuring professionals discussing emerging technologies, career opportunities and current trends in computing.",
        registrationUrl: "/register.html"
    },
    {
        id: 6,
        title: "Midsemester Examination Focus",
        date: "2026-09-07",
        time: "All Day",
        location: "MUBAS Campus",
        category: "meeting",
        description:
            "A period dedicated to academic preparation, revision support and examination activities for all students.",
        registrationUrl: "#"
    },
    {
        id: 7,
        title: "Educational Tour to Sparc Systems",
        date: "2026-09-25",
        time: "7:30 AM",
        location: "Sparc Systems, Lilongwe",
        category: "meeting",
        description:
            "An educational industry visit giving students first-hand exposure to professional ICT environments, enterprise systems and career pathways.",
        registrationUrl: "/register.html"
    },
    {
        id: 8,
        title: "Hackathon Award Ceremony & Corporate Networking",
        date: "2026-10-28",
        time: "9:00 AM",
        location: "MUBAS Auditorium",
        category: "competition",
        description:
            "Celebrating outstanding hackathon projects while providing networking opportunities with industry partners, sponsors and technology professionals.",
        registrationUrl: "/register.html"
    },
    {
        id: 9,
        title: "All-Girls Hackathon",
        date: "2026-10-05",
        time: "9:00 AM",
        location: "Innovation Hub",
        category: "competition",
        description:
            "A dedicated hackathon encouraging female students to innovate, collaborate and develop impactful technology solutions in a supportive environment.",
        registrationUrl: "/register.html"
    },
    {
        id: 10,
        title: "AI-Related Debate",
        date: "2026-10-12",
        time: "2:00 PM",
        location: "Lecture Theatre",
        category: "meeting",
        description:
            "A debate exploring the opportunities, challenges and ethical implications of Artificial Intelligence in society and industry.",
        registrationUrl: "/register.html"
    },
    {
        id: 11,
        title: "Final Technical Tech Talk",
        date: "2026-10-19",
        time: "9:00 AM",
        location: "Lecture Theatre",
        category: "meeting",
        description:
            "The final technology seminar of the semester featuring expert speakers discussing advanced computing topics and industry innovation.",
        registrationUrl: "/register.html"
    },
    {
        id: 12,
        title: "Campaigns & Society Elections",
        date: "2026-10-26",
        time: "9:00 AM",
        location: "MUBAS Campus",
        category: "meeting",
        description:
            "Official CoSISS election campaigns and voting activities where members elect the next executive committee.",
        registrationUrl: "#"
    },
    {
        id: 13,
        title: "Academic Lockdown & Handover Preparations",
        date: "2026-11-02",
        time: "All Day",
        location: "MUBAS Campus",
        category: "meeting",
        description:
            "A period focused on academic preparation while outgoing executives prepare documentation and resources for leadership transition.",
        registrationUrl: "#"
    },
    {
        id: 14,
        title: "Executive Handovers & Post-Mortem Analysis",
        date: "2026-11-09",
        time: "9:00 AM",
        location: "CoSISS Boardroom",
        category: "meeting",
        description:
            "Formal handover of executive responsibilities followed by an evaluation of the year's programmes, achievements and lessons learned.",
        registrationUrl: "#"
    }
];


const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];


const categoryLabels = {
    workshop: "Workshop",
    meeting: "Meeting",
    competition: "Competition",
    social: "Social Event"
};


let displayedDate = getInitialCalendarDate();
let selectedDateKey = null;


document.addEventListener("DOMContentLoaded", () => {
    initialiseMobileNavigation();
    initialiseCalendarControls();
    initialiseEventFilter();
    initialiseModal();
    updateCopyrightYear();

    renderCalendar();
    renderUpcomingEvents("all");
    renderNextEvent();
});


/**
 * Uses the current month when it contains events.
 * Otherwise, it opens the month of the earliest available event.
 *
 * @returns {Date}
 */
function getInitialCalendarDate() {
    const today = new Date();

    const currentMonthContainsEvents = events.some((event) => {
        const eventDate = parseLocalDate(event.date);

        return (
            eventDate.getFullYear() === today.getFullYear() &&
            eventDate.getMonth() === today.getMonth()
        );
    });

    if (currentMonthContainsEvents || events.length === 0) {
        return new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );
    }

    const sortedEvents = [...events].sort(
        (firstEvent, secondEvent) =>
            parseLocalDate(firstEvent.date) -
            parseLocalDate(secondEvent.date)
    );

    const firstEventDate =
        parseLocalDate(sortedEvents[0].date);

    return new Date(
        firstEventDate.getFullYear(),
        firstEventDate.getMonth(),
        1
    );
}


/**
 * Controls the responsive navigation menu.
 */
function initialiseMobileNavigation() {
    const menuToggle =
        document.getElementById("menu-toggle");

    const navigation =
        document.getElementById("main-navigation");

    if (!menuToggle || !navigation) {
        return;
    }

    menuToggle.addEventListener("click", () => {
        const menuIsOpen =
            navigation.classList.toggle("open");

        menuToggle.classList.toggle(
            "active",
            menuIsOpen
        );

        menuToggle.setAttribute(
            "aria-expanded",
            String(menuIsOpen)
        );

        document.body.classList.toggle(
            "menu-open",
            menuIsOpen
        );
    });

    navigation
        .querySelectorAll("a")
        .forEach((link) => {
            link.addEventListener("click", () => {
                closeMobileNavigation(
                    menuToggle,
                    navigation
                );
            });
        });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 980) {
            closeMobileNavigation(
                menuToggle,
                navigation
            );
        }
    });
}


/**
 * Closes the mobile navigation menu.
 *
 * @param {HTMLButtonElement} menuToggle
 * @param {HTMLElement} navigation
 */
function closeMobileNavigation(
    menuToggle,
    navigation
) {
    navigation.classList.remove("open");
    menuToggle.classList.remove("active");

    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.classList.remove("menu-open");
}


/**
 * Connects the previous and next month buttons.
 */
function initialiseCalendarControls() {
    const previousButton =
        document.getElementById("previous-month");

    const nextButton =
        document.getElementById("next-month");

    previousButton?.addEventListener("click", () => {
        displayedDate = new Date(
            displayedDate.getFullYear(),
            displayedDate.getMonth() - 1,
            1
        );

        selectedDateKey = null;

        renderCalendar();
        resetSelectedDatePanel();
    });

    nextButton?.addEventListener("click", () => {
        displayedDate = new Date(
            displayedDate.getFullYear(),
            displayedDate.getMonth() + 1,
            1
        );

        selectedDateKey = null;

        renderCalendar();
        resetSelectedDatePanel();
    });
}


/**
 * Draws the current month.
 */
function renderCalendar() {
    const calendarGrid =
        document.getElementById("calendar-grid");

    const monthElement =
        document.getElementById("calendar-month");

    const yearElement =
        document.getElementById("calendar-year");

    if (
        !calendarGrid ||
        !monthElement ||
        !yearElement
    ) {
        return;
    }

    const year = displayedDate.getFullYear();
    const month = displayedDate.getMonth();

    monthElement.textContent = monthNames[month];
    yearElement.textContent = String(year);

    calendarGrid.innerHTML = "";

    const firstDayIndex =
        new Date(year, month, 1).getDay();

    const numberOfDays =
        new Date(year, month + 1, 0).getDate();

    for (
        let emptyIndex = 0;
        emptyIndex < firstDayIndex;
        emptyIndex += 1
    ) {
        const emptyCell =
            document.createElement("div");

        emptyCell.className =
            "calendar-day empty-day";

        calendarGrid.appendChild(emptyCell);
    }

    for (
        let day = 1;
        day <= numberOfDays;
        day += 1
    ) {
        const dateKey =
            createDateKey(year, month, day);

        const eventsForDay =
            getEventsForDate(dateKey);

        const dayButton =
            createCalendarDayButton(
                year,
                month,
                day,
                dateKey,
                eventsForDay
            );

        calendarGrid.appendChild(dayButton);
    }
}


/**
 * Creates one calendar date button.
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {string} dateKey
 * @param {Array<object>} eventsForDay
 * @returns {HTMLButtonElement}
 */
function createCalendarDayButton(
    year,
    month,
    day,
    dateKey,
    eventsForDay
) {
    const button =
        document.createElement("button");

    button.type = "button";
    button.className = "calendar-day";

    button.setAttribute(
        "aria-label",
        formatLongDate(dateKey)
    );

    if (isToday(year, month, day)) {
        button.classList.add("today");
    }

    if (selectedDateKey === dateKey) {
        button.classList.add("selected");
    }

    const dayNumber =
        document.createElement("span");

    dayNumber.className =
        "calendar-day-number";

    dayNumber.textContent =
        String(day);

    button.appendChild(dayNumber);

    if (eventsForDay.length > 0) {
        const eventIndicators =
            document.createElement("div");

        eventIndicators.className =
            "calendar-day-events";

        const uniqueCategories = [
            ...new Set(
                eventsForDay.map(
                    (event) => event.category
                )
            )
        ];

        uniqueCategories
            .slice(0, 3)
            .forEach((category) => {
                const indicator =
                    document.createElement("span");

                indicator.className =
                    `calendar-event-dot ${category}-dot`;

                eventIndicators.appendChild(indicator);
            });

        const eventCount =
            document.createElement("span");

        eventCount.className =
            "calendar-event-count";

        eventCount.textContent =
            eventsForDay.length === 1
                ? "1 event"
                : `${eventsForDay.length} events`;

        eventIndicators.appendChild(eventCount);
        button.appendChild(eventIndicators);
    }

    button.addEventListener("click", () => {
        selectedDateKey = dateKey;

        renderCalendar();

        renderSelectedDateEvents(
            dateKey,
            eventsForDay
        );
    });

    return button;
}


/**
 * Displays events for the chosen calendar date.
 *
 * @param {string} dateKey
 * @param {Array<object>} eventsForDay
 */
function renderSelectedDateEvents(
    dateKey,
    eventsForDay
) {
    const dateTitle =
        document.getElementById(
            "selected-date-title"
        );

    const dateSummary =
        document.getElementById(
            "selected-date-summary"
        );

    const eventsList =
        document.getElementById(
            "selected-events-list"
        );

    if (
        !dateTitle ||
        !dateSummary ||
        !eventsList
    ) {
        return;
    }

    dateTitle.textContent =
        formatLongDate(dateKey);

    dateSummary.textContent =
        eventsForDay.length === 0
            ? "No CoSISS events are scheduled for this date."
            : eventsForDay.length === 1
                ? "One event is scheduled for this date."
                : `${eventsForDay.length} events are scheduled for this date.`;

    eventsList.innerHTML = "";

    if (eventsForDay.length === 0) {
        eventsList.innerHTML = `
            <div class="no-selected-event">
                <span class="empty-calendar-icon">
                    ${parseLocalDate(dateKey).getDate()}
                </span>

                <p>
                    No events are scheduled for this day.
                </p>
            </div>
        `;

        return;
    }

    eventsForDay.forEach((event) => {
        const eventElement =
            document.createElement("article");

        eventElement.className =
            "selected-event-item";

        eventElement.innerHTML = `
            <span
                class="selected-event-category"
                style="color: ${getCategoryColour(event.category)}"
            >
                ${escapeHtml(
                    categoryLabels[event.category] ||
                    event.category
                )}
            </span>

            <h4>
                ${escapeHtml(event.title)}
            </h4>

            <p>
                ${escapeHtml(event.time)}
            </p>

            <p>
                ${escapeHtml(event.location)}
            </p>

            <button
                type="button"
                class="selected-event-button"
            >
                View details
            </button>
        `;

        const detailsButton =
            eventElement.querySelector(
                ".selected-event-button"
            );

        detailsButton?.addEventListener(
            "click",
            () => openEventModal(event)
        );

        eventsList.appendChild(eventElement);
    });
}


/**
 * Restores the selected-date panel.
 */
function resetSelectedDatePanel() {
    const dateTitle =
        document.getElementById(
            "selected-date-title"
        );

    const dateSummary =
        document.getElementById(
            "selected-date-summary"
        );

    const eventsList =
        document.getElementById(
            "selected-events-list"
        );

    if (dateTitle) {
        dateTitle.textContent = "Select a date";
    }

    if (dateSummary) {
        dateSummary.textContent =
            "Event information will appear here.";
    }

    if (eventsList) {
        eventsList.innerHTML = `
            <div class="no-selected-event">
                <span class="empty-calendar-icon">
                    00
                </span>

                <p>
                    Select a highlighted date from the calendar.
                </p>
            </div>
        `;
    }
}


/**
 * Connects the upcoming-event category filter.
 */
function initialiseEventFilter() {
    const filter =
        document.getElementById(
            "event-category-filter"
        );

    filter?.addEventListener("change", () => {
        renderUpcomingEvents(filter.value);
    });
}


/**
 * Draws upcoming event cards.
 *
 * @param {string} category
 */
function renderUpcomingEvents(category) {
    const eventGrid =
        document.getElementById("events-grid");

    const emptyState =
        document.getElementById(
            "empty-events-state"
        );

    if (!eventGrid || !emptyState) {
        return;
    }

    const sortedEvents = [...events].sort(
        (firstEvent, secondEvent) =>
            parseLocalDate(firstEvent.date) -
            parseLocalDate(secondEvent.date)
    );

    const filteredEvents =
        category === "all"
            ? sortedEvents
            : sortedEvents.filter(
                (event) =>
                    event.category === category
            );

    eventGrid.innerHTML = "";

    emptyState.hidden =
        filteredEvents.length > 0;

    filteredEvents.forEach((event) => {
        const eventDate =
            parseLocalDate(event.date);

        const eventCard =
            document.createElement("article");

        eventCard.className = "event-card";

        eventCard.innerHTML = `
            <div class="event-card-banner">

                <div class="event-card-date">
                    <span class="event-card-day">
                        ${eventDate.getDate()}
                    </span>

                    <span class="event-card-month">
                        ${monthNames[
                            eventDate.getMonth()
                        ].slice(0, 3)}
                    </span>
                </div>

                <span class="event-card-category">
                    ${escapeHtml(
                        categoryLabels[event.category] ||
                        event.category
                    )}
                </span>

            </div>

            <div class="event-card-content">

                <h3>
                    ${escapeHtml(event.title)}
                </h3>

                <div class="event-card-information">
                    <p>
                        <strong>Time:</strong>
                        ${escapeHtml(event.time)}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${escapeHtml(event.location)}
                    </p>
                </div>

                <p class="event-card-description">
                    ${escapeHtml(event.description)}
                </p>

                <button
                    type="button"
                    class="event-card-button"
                >
                    View Event
                </button>

            </div>
        `;

        const viewButton =
            eventCard.querySelector(
                ".event-card-button"
            );

        viewButton?.addEventListener(
            "click",
            () => openEventModal(event)
        );

        eventGrid.appendChild(eventCard);
    });
}


/**
 * Displays the closest upcoming event.
 */
function renderNextEvent() {
    const titleElement =
        document.getElementById(
            "next-event-title"
        );

    const dateElement =
        document.getElementById(
            "next-event-date"
        );

    const locationElement =
        document.getElementById(
            "next-event-location"
        );

    if (
        !titleElement ||
        !dateElement ||
        !locationElement
    ) {
        return;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events
        .filter(
            (event) =>
                parseLocalDate(event.date) >= today
        )
        .sort(
            (firstEvent, secondEvent) =>
                parseLocalDate(firstEvent.date) -
                parseLocalDate(secondEvent.date)
        );

    const nextEvent =
        upcomingEvents[0] || events[0];

    if (!nextEvent) {
        titleElement.textContent =
            "No upcoming event";

        dateElement.textContent =
            "New activities will be announced soon.";

        locationElement.textContent = "";

        return;
    }

    titleElement.textContent =
        nextEvent.title;

    dateElement.textContent =
        `${formatLongDate(nextEvent.date)} · ${nextEvent.time}`;

    locationElement.textContent =
        nextEvent.location;
}


/**
 * Prepares modal event handlers.
 */
function initialiseModal() {
    const modal =
        document.getElementById("event-modal");

    const closeButton =
        document.getElementById(
            "modal-close-button"
        );

    if (!modal || !closeButton) {
        return;
    }

    closeButton.addEventListener(
        "click",
        closeEventModal
    );

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeEventModal();
        }
    });

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                !modal.hidden
            ) {
                closeEventModal();
            }
        }
    );
}


/**
 * Opens an event detail modal.
 *
 * @param {object} event
 */
function openEventModal(event) {
    const modal =
        document.getElementById("event-modal");

    const categoryElement =
        document.getElementById(
            "modal-event-category"
        );

    const titleElement =
        document.getElementById(
            "modal-event-title"
        );

    const dateElement =
        document.getElementById(
            "modal-event-date"
        );

    const timeElement =
        document.getElementById(
            "modal-event-time"
        );

    const locationElement =
        document.getElementById(
            "modal-event-location"
        );

    const descriptionElement =
        document.getElementById(
            "modal-event-description"
        );

    const registrationButton =
        document.getElementById(
            "modal-register-button"
        );

    if (
        !modal ||
        !categoryElement ||
        !titleElement ||
        !dateElement ||
        !timeElement ||
        !locationElement ||
        !descriptionElement ||
        !registrationButton
    ) {
        return;
    }

    categoryElement.textContent =
        categoryLabels[event.category] ||
        event.category;

    titleElement.textContent =
        event.title;

    dateElement.textContent =
        formatLongDate(event.date);

    timeElement.textContent =
        event.time;

    locationElement.textContent =
        event.location;

    descriptionElement.textContent =
        event.description;

    registrationButton.href =
        event.registrationUrl || "#";

    registrationButton.textContent =
        event.registrationUrl === "#"
            ? "Registration Not Required"
            : "Register for Event";

    modal.hidden = false;

    document.body.classList.add(
        "modal-open"
    );

    document
        .getElementById("modal-close-button")
        ?.focus();
}


/**
 * Closes the event modal.
 */
function closeEventModal() {
    const modal =
        document.getElementById("event-modal");

    if (!modal) {
        return;
    }

    modal.hidden = true;

    document.body.classList.remove(
        "modal-open"
    );
}


/**
 * Gets events assigned to one date.
 *
 * @param {string} dateKey
 * @returns {Array<object>}
 */
function getEventsForDate(dateKey) {
    return events.filter(
        (event) => event.date === dateKey
    );
}


/**
 * Creates a YYYY-MM-DD date key.
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {string}
 */
function createDateKey(year, month, day) {
    const monthValue =
        String(month + 1).padStart(2, "0");

    const dayValue =
        String(day).padStart(2, "0");

    return `${year}-${monthValue}-${dayValue}`;
}


/**
 * Parses a YYYY-MM-DD value as a local date.
 * This avoids timezone-based date changes.
 *
 * @param {string} dateValue
 * @returns {Date}
 */
function parseLocalDate(dateValue) {
    const [year, month, day] =
        dateValue
            .split("-")
            .map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}


/**
 * Formats a date for display.
 *
 * @param {string} dateValue
 * @returns {string}
 */
function formatLongDate(dateValue) {
    return parseLocalDate(dateValue)
        .toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
}


/**
 * Checks whether a calendar date is today.
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {boolean}
 */
function isToday(year, month, day) {
    const today = new Date();

    return (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
    );
}


/**
 * Provides the correct colour for an event category.
 *
 * @param {string} category
 * @returns {string}
 */
function getCategoryColour(category) {
    const colours = {
        workshop: "#0b6faf",
        meeting: "#7457c5",
        competition: "#dc7600",
        social: "#18875a"
    };

    return colours[category] || "#003074";
}


/**
 * Prevents event data from injecting HTML.
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/**
 * Displays the current year in the footer.
 */
function updateCopyrightYear() {
    const yearElement =
        document.getElementById(
            "current-year"
        );

    if (!yearElement) {
        return;
    }

    yearElement.textContent =
        String(new Date().getFullYear());
}