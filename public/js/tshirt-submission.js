const form = document.getElementById("tshirt-submission-form");

const submitButton = document.getElementById("submit-button");

const feedbackElement = document.getElementById("form-feedback");

const closedSection = document.getElementById("submissions-closed");

const slotCounter = document.getElementById("slot-counter");

const counterProgress = document.getElementById("counter-progress");

const counterMessage = document.getElementById("counter-message");

const descriptionInput =
    document.getElementById("designDescription");

const descriptionCount =
    document.getElementById("description-count");

const designImageInput =
    document.getElementById("designImage");

const previewContainer =
    document.getElementById("file-preview");

const previewImage =
    document.getElementById("design-preview-image");

const previewFileName =
    document.getElementById("preview-file-name");

const previewFileSize =
    document.getElementById("preview-file-size");

const removeDesignButton =
    document.getElementById("remove-design-button");

const MAX_SUBMISSIONS = 10;

const MAX_FILE_SIZE =
    10 * 1024 * 1024;

const allowedMimeTypes = [
    "image/png",
    "image/jpeg"
];

const fieldNames = [
    "firstName",
    "surname",
    "studentId",
    "phone",
    "email",
    "designTitle",
    "designDescription",
    "designImage",
    "originalWork"
];


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        updateDescriptionCount();

        await loadSubmissionStatus();
    }
);


/* =========================================================
   DESCRIPTION COUNTER
   ========================================================= */

descriptionInput.addEventListener(
    "input",
    updateDescriptionCount
);

function updateDescriptionCount() {
    const currentLength =
        descriptionInput.value.length;

    descriptionCount.textContent =
        `${currentLength} / 800`;
}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

designImageInput.addEventListener(
    "change",
    handleDesignSelection
);

function handleDesignSelection() {
    clearFieldError("designImage");

    const file =
        designImageInput.files[0];

    if (!file) {
        clearDesignPreview();
        return;
    }

    const validationError =
        validateDesignFile(file);

    if (validationError) {
        showFieldError(
            "designImage",
            validationError
        );

        designImageInput.value = "";

        clearDesignPreview();

        return;
    }

    previewFileName.textContent =
        file.name;

    previewFileSize.textContent =
        formatFileSize(file.size);

    const reader =
        new FileReader();

    reader.onload = () => {
        previewImage.src =
            reader.result;

        previewContainer.hidden =
            false;
    };

    reader.readAsDataURL(file);
}


removeDesignButton.addEventListener(
    "click",
    () => {
        designImageInput.value = "";

        clearDesignPreview();

        clearFieldError(
            "designImage"
        );
    }
);


function clearDesignPreview() {
    previewContainer.hidden = true;

    previewImage.src = "";

    previewFileName.textContent = "";

    previewFileSize.textContent = "";
}


function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} bytes`;
    }

    const kilobytes =
        bytes / 1024;

    if (kilobytes < 1024) {
        return `${kilobytes.toFixed(1)} KB`;
    }

    const megabytes =
        kilobytes / 1024;

    return `${megabytes.toFixed(2)} MB`;
}


function validateDesignFile(file) {
    if (
        !allowedMimeTypes.includes(
            file.type
        )
    ) {
        return (
            "Only PNG, JPG or JPEG images are allowed."
        );
    }

    if (
        file.size > MAX_FILE_SIZE
    ) {
        return (
            "The design image must not exceed 10 MB."
        );
    }

    return null;
}


/* =========================================================
   LOAD CURRENT SUBMISSION COUNT
   ========================================================= */

async function loadSubmissionStatus() {
    try {
        const response =
            await fetch(
                "/api/tshirt-designs/status",
                {
                    method: "GET",
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        let result = {};

        try {
            result =
                await response.json();
        } catch (_) {}

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Unable to load submission status."
            );
        }

        const submitted =
            Number(
                result.submitted ?? 0
            );

        const limit =
            Number(
                result.limit ??
                MAX_SUBMISSIONS
            );

        updateSubmissionCounter(
            submitted,
            limit
        );

        if (
            result.closed === true ||
            submitted >= limit
        ) {
            closeSubmissionForm();
        } else {
            openSubmissionForm();
        }
    } catch (error) {
        console.error(
            "Could not load submission status:",
            error
        );

        slotCounter.textContent =
            "Unavailable";

        counterMessage.textContent =
            "Could not check available slots.";

        counterProgress.style.width =
            "0%";
    }
}


/* =========================================================
   COUNTER
   ========================================================= */

function updateSubmissionCounter(
    submitted,
    limit
) {
    const safeSubmitted =
        Math.max(
            0,
            Math.min(
                submitted,
                limit
            )
        );

    const remaining =
        Math.max(
            limit -
            safeSubmitted,
            0
        );

    slotCounter.textContent =
        `${safeSubmitted} / ${limit} filled`;

    const progress =
        limit > 0
            ? (
                safeSubmitted /
                limit
            ) * 100
            : 0;

    counterProgress.style.width =
        `${progress}%`;

    if (remaining === 0) {
        counterMessage.textContent =
            "All submission slots have been filled.";
    } else if (remaining === 1) {
        counterMessage.textContent =
            "Only 1 submission slot remains.";
    } else {
        counterMessage.textContent =
            `${remaining} submission slots remain.`;
    }
}


/* =========================================================
   OPEN / CLOSE FORM
   ========================================================= */

function closeSubmissionForm() {
    form.hidden = true;

    closedSection.hidden = false;
}


function openSubmissionForm() {
    form.hidden = false;

    closedSection.hidden = true;
}


/* =========================================================
   FORM SUBMISSION
   ========================================================= */

form.addEventListener(
    "submit",
    handleSubmission
);


async function handleSubmission(event) {
    event.preventDefault();

    clearMessages();

    const errors =
        validateForm();

    if (errors) {
        displayErrors(errors);

        focusFirstInvalidField(
            errors
        );

        return;
    }

    await submitDesign();
}


/* =========================================================
   FORM VALIDATION
   ========================================================= */

function validateForm() {
    const errors = {};

    const firstName =
        String(
            document
                .getElementById(
                    "firstName"
                )
                .value || ""
        ).trim();

    const surname =
        String(
            document
                .getElementById(
                    "surname"
                )
                .value || ""
        ).trim();

    const studentId =
        String(
            document
                .getElementById(
                    "studentId"
                )
                .value || ""
        ).trim();

    const phone =
        String(
            document
                .getElementById(
                    "phone"
                )
                .value || ""
        )
            .trim()
            .replace(
                /[\s-]/g,
                ""
            );

    const email =
        String(
            document
                .getElementById(
                    "email"
                )
                .value || ""
        )
            .trim()
            .toLowerCase();

    const designTitle =
        String(
            document
                .getElementById(
                    "designTitle"
                )
                .value || ""
        ).trim();

    const designDescription =
        String(
            descriptionInput.value ||
            ""
        ).trim();

    const originalWork =
        document
            .getElementById(
                "originalWork"
            )
            .checked;

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phonePattern =
        /^(?:\+265|0)?[789]\d{8}$/;


    if (!firstName) {
        errors.firstName =
            "Enter your first name.";
    } else if (
        firstName.length < 2
    ) {
        errors.firstName =
            "First name must contain at least 2 characters.";
    }


    if (!surname) {
        errors.surname =
            "Enter your surname.";
    } else if (
        surname.length < 2
    ) {
        errors.surname =
            "Surname must contain at least 2 characters.";
    }


    if (!studentId) {
        errors.studentId =
            "Student ID is required.";
    }


    if (!phone) {
        errors.phone =
            "Phone number is required.";
    } else if (
        !phonePattern.test(phone)
    ) {
        errors.phone =
            "Enter a valid Malawi phone number.";
    }


    if (!email) {
        errors.email =
            "Email address is required.";
    } else if (
        !emailPattern.test(email)
    ) {
        errors.email =
            "Enter a valid email address.";
    }


    if (!designTitle) {
        errors.designTitle =
            "Give your design a title.";
    } else if (
        designTitle.length < 3
    ) {
        errors.designTitle =
            "Design title must contain at least 3 characters.";
    }


    if (!designDescription) {
        errors.designDescription =
            "Explain the concept behind your design.";
    } else if (
        designDescription.length < 20
    ) {
        errors.designDescription =
            "Please provide a slightly more detailed explanation.";
    }


    const file =
        designImageInput.files[0];

    if (!file) {
        errors.designImage =
            "Upload your T-shirt design.";
    } else {
        const fileError =
            validateDesignFile(file);

        if (fileError) {
            errors.designImage =
                fileError;
        }
    }


    if (!originalWork) {
        errors.originalWork =
            "You must confirm that the design is your original work.";
    }


    return Object.keys(errors)
        .length
        ? errors
        : null;
}


/* =========================================================
   DISPLAY VALIDATION ERRORS
   ========================================================= */

function displayErrors(errors) {
    Object.entries(errors)
        .forEach(
            (
                [
                    fieldName,
                    message
                ]
            ) => {
                showFieldError(
                    fieldName,
                    message
                );
            }
        );
}


function showFieldError(
    fieldName,
    message
) {
    const errorElement =
        document.getElementById(
            `${fieldName}-error`
        );

    if (errorElement) {
        errorElement.textContent =
            message;
    }
}


function clearFieldError(
    fieldName
) {
    const errorElement =
        document.getElementById(
            `${fieldName}-error`
        );

    if (errorElement) {
        errorElement.textContent =
            "";
    }
}


function focusFirstInvalidField(
    errors
) {
    const firstInvalidField =
        fieldNames.find(
            fieldName =>
                errors[fieldName]
        );

    if (!firstInvalidField) {
        return;
    }

    const input =
        document.getElementById(
            firstInvalidField
        );

    if (input) {
        input.focus();
    }
}


/* =========================================================
   FEEDBACK
   ========================================================= */

function clearMessages() {
    feedbackElement.hidden =
        true;

    feedbackElement.textContent =
        "";

    feedbackElement.classList.remove(
        "success",
        "error"
    );

    fieldNames.forEach(
        fieldName => {
            clearFieldError(
                fieldName
            );
        }
    );
}


function showFeedback(
    message,
    type = "error"
) {
    feedbackElement.textContent =
        message;

    feedbackElement.hidden =
        false;

    feedbackElement.classList.remove(
        "success",
        "error"
    );

    feedbackElement.classList.add(
        type
    );

    feedbackElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function setLoadingState(
    isLoading
) {
    submitButton.disabled =
        isLoading;

    const text =
        submitButton.querySelector(
            "span"
        );

    const icon =
        submitButton.querySelector(
            "i"
        );

    if (text) {
        text.textContent =
            isLoading
                ? "Submitting..."
                : "Submit my design";
    }

    if (icon) {
        icon.className =
            isLoading
                ? "fa-solid fa-spinner fa-spin"
                : "fa-solid fa-arrow-right";
    }
}


/* =========================================================
   SEND DESIGN TO SERVER
   ========================================================= */

async function submitDesign() {
    setLoadingState(true);

    try {
        const formData =
            new FormData(form);

        const response =
            await fetch(
                "/api/tshirt-designs",
                {
                    method: "POST",
                    body: formData
                }
            );

        let result = {};

        try {
            result =
                await response.json();
        } catch (_) {}

        if (!response.ok) {
            if (
                response.status ===
                409 &&
                result.closed === true
            ) {
                closeSubmissionForm();

                updateSubmissionCounter(
                    MAX_SUBMISSIONS,
                    MAX_SUBMISSIONS
                );

                return;
            }

            showFeedback(
                result.error ||
                "Your design could not be submitted. Please try again.",
                "error"
            );

            return;
        }

        showFeedback(
            result.message ||
            "Your design was submitted successfully.",
            "success"
        );

        form.reset();

        clearDesignPreview();

        updateDescriptionCount();

        const submitted =
            Number(
                result.submitted ??
                (
                    MAX_SUBMISSIONS -
                    Number(
                        result.remainingSlots ??
                        0
                    )
                )
            );

        const limit =
            Number(
                result.limit ??
                MAX_SUBMISSIONS
            );

        updateSubmissionCounter(
            submitted,
            limit
        );

        if (
            result.closed === true ||
            submitted >= limit
        ) {
            window.setTimeout(
                () => {
                    closeSubmissionForm();
                },
                1600
            );
        }
    } catch (error) {
        console.error(
            "Design submission failed:",
            error
        );

        showFeedback(
            "The server could not be reached. Please try again shortly.",
            "error"
        );
    } finally {
        setLoadingState(false);
    }
}


/* =========================================================
   FORM RESET
   ========================================================= */

form.addEventListener(
    "reset",
    () => {
        window.setTimeout(
            () => {
                clearMessages();

                clearDesignPreview();

                updateDescriptionCount();
            },
            0
        );
    }
);