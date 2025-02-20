document.addEventListener("DOMContentLoaded", function () {
  const languageButton = document.getElementById("language-button");
  const languageDropdown = document.getElementById("language-dropdown");
  const languageOptions = document.querySelectorAll(".language-option");
  const loader = document.createElement("div");

  loader.id = "translation-loader";
  loader.innerHTML = "Translating...";
  document.body.appendChild(loader);
  loader.style.display = "none";

  function showLoader() {
    loader.style.display = "flex";
  }

  function hideLoader() {
    loader.style.display = "none";
  }

  // Restore previously selected language
  let savedLang = localStorage.getItem("selectedLanguage");
  if (savedLang) {
    setLanguageButton(savedLang);
    if (savedLang !== "en") {
      applyTranslation(savedLang);
    }
  }

  // Toggle dropdown visibility
  languageButton.addEventListener("click", function () {
    languageDropdown.classList.toggle("hidden");
    languageDropdown.style.display = languageDropdown.classList.contains(
      "hidden"
    )
      ? "none"
      : "block";
  });

  // Select Language & Translate
  languageOptions.forEach((option) => {
    option.addEventListener("click", function () {
      let selectedLang = this.dataset.lang;
      localStorage.setItem("selectedLanguage", selectedLang);

      setLanguageButton(selectedLang);
      languageDropdown.style.display = "none";

      if (selectedLang === "en") {
        localStorage.removeItem("selectedLanguage");
        location.reload();
        return;
      }

      applyTranslation(selectedLang);
    });
  });

  function setLanguageButton(lang) {
    let selectedOption = document.querySelector(
      `.language-option[data-lang="${lang}"]`
    );
    if (selectedOption) {
      languageButton.innerHTML = selectedOption.innerHTML + " ▼";
    }
  }

  async function applyTranslation(targetLang) {
    showLoader();

    let textNodes = [];
    let walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    while (walker.nextNode()) {
      let node = walker.currentNode;
      let parent = node.parentNode;

      // Exclude elements inside language switcher, icons, and specific elements
      if (
        node.nodeValue.trim() &&
        parent.offsetParent !== null &&
        !parent.closest(".language-switcher") &&
        !parent.closest("svg") && // Exclude SVG icons
        !parent.closest("i") && // Exclude <i> icons (FontAwesome, Bootstrap icons)
        !parent.closest("code") && // Exclude code snippets
        !parent.closest("pre") // Exclude preformatted text (e.g., code blocks)
      ) {
        textNodes.push(node);
      }
    }

    // Extract text from nodes
    let texts = textNodes.map((node) => node.nodeValue.trim());

    // Filter out unnecessary symbols, numbers, and CSS-like texts
    texts = texts.filter(
      (text) =>
        text.length > 2 && // Avoid single characters (like punctuation)
        !text.match(/^[-+.\d\s]+$/) && // Avoid numbers, phone numbers
        !text.match(/[{};:#]/) && // Avoid CSS-like properties
        !text.match(/\.path{/) // Avoid CSS class definitions
    );

    let translations = await translateTexts(texts, targetLang);

    if (translations) {
      let index = 0;
      textNodes.forEach((node) => {
        if (index < translations.length) {
          node.nodeValue = translations[index] || node.nodeValue;
          index++;
        }
      });
    }

    hideLoader();
  }

  // Function to Call OpenAI API
  async function translateTexts(texts, targetLang) {
    let apiKey = "key";
    let url = "https://api.openai.com/v1/chat/completions";

    let prompt =
      `Translate the following text to ${targetLang}, but do not translate code, symbols, or numbers:\n\n` +
      texts.join("\n");

    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a professional website translator. Do not translate symbols, numbers, CSS code, or code snippets.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    let data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content.split("\n");
    } else {
      console.error("Translation error:", data);
      return null;
    }
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !languageButton.contains(event.target) &&
      !languageDropdown.contains(event.target)
    ) {
      languageDropdown.style.display = "none";
    }
  });
});
