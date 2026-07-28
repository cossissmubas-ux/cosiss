"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initialiseMobileNavigation();
    initialiseCommitteeFilters();
    updateCopyrightYear();
    updateCommitteeCount();
});


/**
 * Controls the mobile navigation menu.
 */
function initialiseMobileNavigation() {
    const menuToggle = document.getElementById("menu-toggle");
    const navigation = document.getElementById("main-navigation");

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
        .forEach((navigationLink) => {
            navigationLink.addEventListener("click", () => {
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
 * Filters committee cards by leadership area.
 */
function initialiseCommitteeFilters() {
    const filterButtons =
        document.querySelectorAll(".filter-button");

    const committeeCards =
        document.querySelectorAll(".committee-card");

    const emptyState =
        document.getElementById("empty-state");

    if (
        filterButtons.length === 0 ||
        committeeCards.length === 0
    ) {
        return;
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedFilter =
                button.dataset.filter;

            setActiveFilterButton(
                filterButtons,
                button
            );

            const visibleCount =
                filterCommitteeCards(
                    committeeCards,
                    selectedFilter
                );

            if (emptyState) {
                emptyState.hidden = visibleCount > 0;
            }
        });
    });
}


/**
 * Marks the selected filter button as active.
 *
 * @param {NodeListOf<Element>} filterButtons
 * @param {Element} selectedButton
 */
function setActiveFilterButton(
    filterButtons,
    selectedButton
) {
    filterButtons.forEach((button) => {
        button.classList.remove("active");
    });

    selectedButton.classList.add("active");
}


/**
 * Displays committee cards matching a selected category.
 *
 * @param {NodeListOf<Element>} committeeCards
 * @param {string} selectedFilter
 * @returns {number}
 */
function filterCommitteeCards(
    committeeCards,
    selectedFilter
) {
    let visibleCount = 0;

    committeeCards.forEach((card) => {
        const category =
            card.dataset.category;

        const shouldDisplay =
            selectedFilter === "all" ||
            category === selectedFilter;

        card.classList.toggle(
            "hidden",
            !shouldDisplay
        );

        if (shouldDisplay) {
            visibleCount += 1;
        }
    });

    return visibleCount;
}


/**
 * Displays the current year in the footer.
 */
function updateCopyrightYear() {
    const yearElement =
        document.getElementById("current-year");

    if (!yearElement) {
        return;
    }

    yearElement.textContent =
        String(new Date().getFullYear());
}


/**
 * Calculates the number of committee member cards.
 */
function updateCommitteeCount() {
    const countElement =
        document.getElementById("committee-count");

    if (!countElement) {
        return;
    }

    const totalMembers =
        document.querySelectorAll(
            ".committee-card"
        ).length;

    countElement.textContent =
        String(totalMembers);
}