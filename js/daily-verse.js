// js/daily-verse.js

const bibleVerses = [
    { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11" },
    { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
    { text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.", reference: "Psalm 34:18" },
    { text: "I can do all this through him who gives me strength.", reference: "Philippians 4:13" },
    { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
    { text: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28" },
    { text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", reference: "Isaiah 40:31" },
    { text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.", reference: "John 14:27" },
    { text: "The Lord is my shepherd, I lack nothing.", reference: "Psalm 23:1" },
    { text: "He heals the brokenhearted and binds up their wounds.", reference: "Psalm 147:3" },
    { text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.", reference: "Isaiah 41:10" },
    { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28" },
    { text: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5" },
    { text: "God is our refuge and strength, an ever-present help in trouble.", reference: "Psalm 46:1" },
    { text: "My flesh and my heart may fail, but God is the strength of my heart and my portion forever.", reference: "Psalm 73:26" },
    { text: "The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?", reference: "Psalm 27:1" },
    { text: "Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.", reference: "Psalm 55:22" },
    { text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.", reference: "Psalm 23:4" },
    { text: "Let all that you do be done in love.", reference: "1 Corinthians 16:14" },
    { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
    { text: "The name of the Lord is a fortified tower; the righteous run to it and are safe.", reference: "Proverbs 18:10" },
    { text: "When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you.", reference: "Isaiah 43:2" },
    { text: "This is the day the Lord has made; We will rejoice and be glad in it.", reference: "Psalm 118:24" },
    { text: "Give thanks to the Lord, for he is good; his love endures forever.", reference: "Psalm 107:1" },
    { text: "The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.", reference: "Zephaniah 3:17" },
    { text: "Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.", reference: "Matthew 6:34" },
    { text: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.", reference: "Philippians 4:7" },
    { text: "Blessed are those who mourn, for they will be comforted.", reference: "Matthew 5:4" },
    { text: "Wait for the Lord; be strong and take heart and wait for the Lord.", reference: "Psalm 27:14" },
    { text: "I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world.", reference: "John 16:33" }
];

function getDailyVerse() {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('verse_date');
    let verseIndex = parseInt(localStorage.getItem('verse_index'));

    // If it's a new day or no verse stored, pick a new one
    if (storedDate !== today || isNaN(verseIndex)) {
        // Get list of seen indices to avoid repetition until all are shown
        let seenIndices = JSON.parse(localStorage.getItem('seen_verse_indices') || '[]');

        if (seenIndices.length >= bibleVerses.length) {
            seenIndices = []; // Reset if shown all
        }

        // Find a random index not in seenIndices
        let attempts = 0;
        do {
            verseIndex = Math.floor(Math.random() * bibleVerses.length);
            attempts++;
        } while (seenIndices.includes(verseIndex) && attempts < 100);

        seenIndices.push(verseIndex);

        localStorage.setItem('verse_date', today);
        localStorage.setItem('verse_index', verseIndex);
        localStorage.setItem('seen_verse_indices', JSON.stringify(seenIndices));
    }

    return bibleVerses[verseIndex];
}

function displayDailyVerse() {
    const verse = getDailyVerse();
    if (!verse) return;

    // Create verse container if it doesn't exist
    let verseContainer = document.getElementById('dailyVerseContainer');

    if (!verseContainer) {
        // Create it and append to body or footer
        verseContainer = document.createElement('div');
        verseContainer.id = 'dailyVerseContainer';
        verseContainer.className = 'daily-verse-popup animate-slide-up';

        // Add content
        verseContainer.innerHTML = `
            <div class="verse-content">
                <button class="close-verse" id="closeVerseBtn">&times;</button>
                <h3><i class="fas fa-book-open"></i> Verse of the Day</h3>
                <p class="verse-text">"${verse.text}"</p>
                <p class="verse-ref">— ${verse.reference}</p>
            </div>
        `;

        document.body.appendChild(verseContainer);

        // Add event listener programmatically
        document.getElementById('closeVerseBtn').addEventListener('click', function () {
            document.getElementById('dailyVerseContainer').style.display = 'none';
        });
    } else {
        // If exists, make sure it's visible (optional, mostly for testing)
        // verseContainer.style.display = 'block';
    }
}

// Expose to window for global access
window.dailyVerse = {
    get: getDailyVerse,
    display: displayDailyVerse
};
