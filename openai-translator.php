<?php
/*
Plugin Name: Open AI Translator
Description: Translate your website and make it multilingual.
Version: 1.2
Author: Aafreen Sayyed
*/

// Enqueue Styles & Scripts Properly
function openai_translator_enqueue_assets() {
    wp_enqueue_style('openai-translator-style', plugin_dir_url(__FILE__) . 'style.css');
    wp_enqueue_script('openai-translator-script', plugin_dir_url(__FILE__) . 'script.js', array('jquery'), false, true);
}
add_action('wp_enqueue_scripts', 'openai_translator_enqueue_assets');

// Language Switcher HTML
function openai_language_switcher() {
    ?>
    <div class="language-switcher">
        <button id="language-button">
            <img src="https://flagcdn.com/w40/gb.png" alt="English"> English ▼
        </button>
        <ul id="language-dropdown" class="hidden">
            <li class="language-option" data-lang="en">
                <img src="https://flagcdn.com/w40/gb.png" alt="English"> English
            </li>
            <li class="language-option" data-lang="da">
                <img src="https://flagcdn.com/w40/dk.png" alt="Danish"> Danish
            </li>
            <li class="language-option" data-lang="ru">
                <img src="https://flagcdn.com/w40/ru.png" alt="Russian"> Russian
            </li>
            <li class="language-option" data-lang="de">
                <img src="https://flagcdn.com/w40/de.png" alt="German"> German
            </li>
            <li class="language-option" data-lang="fr">
                <img src="https://flagcdn.com/w40/fr.png" alt="French"> French
            </li>
        </ul>
    </div>
    <?php
}
add_action('wp_footer', 'openai_language_switcher');
