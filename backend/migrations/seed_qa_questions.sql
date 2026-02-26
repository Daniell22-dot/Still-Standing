-- Seed Q&A Questions for STILL STANDING
-- Run this after creating the qa_questions table
-- Insert seed questions with common mental health topics
INSERT INTO qa_questions (
        user_id,
        question,
        category,
        is_anonymous,
        status,
        views,
        upvotes,
        created_at
    )
VALUES (
        NULL,
        'How do I tell my family that I need professional help without them judging me?',
        'family support',
        TRUE,
        'answered',
        234,
        45,
        DATE_SUB(NOW(), INTERVAL 7 DAY)
    ),
    (
        NULL,
        'What are some grounding techniques that actually work for panic attacks?',
        'anxiety',
        TRUE,
        'answered',
        567,
        89,
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    (
        NULL,
        'Is it normal to feel worse before feeling better in therapy?',
        'therapy',
        TRUE,
        'answered',
        432,
        76,
        DATE_SUB(NOW(), INTERVAL 10 DAY)
    ),
    (
        NULL,
        'How can I support a friend who is going through depression without burning myself out?',
        'supporting others',
        TRUE,
        'answered',
        345,
        62,
        DATE_SUB(NOW(), INTERVAL 3 DAY)
    ),
    (
        NULL,
        'What should I do when I feel like giving up on recovery?',
        'recovery',
        TRUE,
        'pending',
        123,
        34,
        DATE_SUB(NOW(), INTERVAL 1 DAY)
    ),
    (
        NULL,
        'Are there any apps or tools that help with tracking mood and triggers?',
        'tools',
        TRUE,
        'answered',
        678,
        98,
        DATE_SUB(NOW(), INTERVAL 14 DAY)
    ),
    (
        NULL,
        'How do I deal with guilt about taking medication for mental health?',
        'medication',
        TRUE,
        'answered',
        456,
        71,
        DATE_SUB(NOW(), INTERVAL 6 DAY)
    ),
    (
        NULL,
        'What are healthy ways to cope with grief without numbing the pain?',
        'grief',
        TRUE,
        'pending',
        89,
        12,
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    ),
    (
        NULL,
        'How can I rebuild my self-esteem after leaving an abusive relationship?',
        'recovery',
        TRUE,
        'answered',
        512,
        83,
        DATE_SUB(NOW(), INTERVAL 9 DAY)
    ),
    (
        NULL,
        'Is it possible to heal from childhood trauma as an adult?',
        'trauma',
        TRUE,
        'answered',
        789,
        142,
        DATE_SUB(NOW(), INTERVAL 12 DAY)
    );
-- Insert some helpful answers
INSERT INTO qa_answers (
        question_id,
        user_id,
        answer,
        is_expert,
        upvotes,
        is_accepted,
        created_at
    )
VALUES (
        1,
        NULL,
        'Start by choosing one trusted family member to talk to first. Share your feelings honestly and let them know you need their support, not judgment. Remember, seeking help is a sign of strength, not weakness.',
        FALSE,
        23,
        TRUE,
        DATE_SUB(NOW(), INTERVAL 6 DAY)
    ),
    (
        2,
        NULL,
        'The 5-4-3-2-1 technique works well: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Also try cold water on your face, deep breathing (4-7-8 method), or holding ice cubes.',
        FALSE,
        42,
        TRUE,
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    ),
    (
        3,
        NULL,
        'Yes, absolutely normal! Therapy often brings up painful emotions before healing happens. It\'s like cleaning a wound - uncomfortable but necessary. Talk to your therapist about what you\'re experiencing.',
        FALSE,
        38,
        TRUE,
        DATE_SUB(NOW(), INTERVAL 9 DAY)
    ),
    (
        4,
        NULL,
        'Set boundaries! You can be supportive without sacrificing your own mental health. Listen without trying to fix, encourage professional help, and remember you can\'t pour from an empty cup. Take care of yourself too.',
        FALSE,
        31,
        TRUE,
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    ),
    (
        6,
        NULL,
        'I recommend Daylio for mood tracking, Headspace for meditation, and BetterHelp/Talkspace for online therapy. For crisis support, Crisis Text Line (text HOME to 741741) is great.',
        FALSE,
        54,
        TRUE,
        DATE_SUB(NOW(), INTERVAL 13 DAY)
    ),
    (
        7,
        NULL,
        'Medication is a tool, just like therapy or exercise. There\'s no shame in using the tools available to you. Would you feel guilty about taking insulin for diabetes? Mental health is health, period.',
        FALSE,
        45,
        TRUE,
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    (
        9,
        NULL,
        'Rebuilding takes time, but it\'s possible! Start with small achievements, practice positive self-talk, set boundaries, and celebrate every victory. Consider therapy to work through the trauma. You deserve love and respect.',
        FALSE,
        47,
        TRUE,
        DATE_SUB(NOW(), INTERVAL 8 DAY)
    ),
    (
        10,
        NULL,
        'Yes! While childhood trauma shapes us, it doesn\'t define us forever. Therapy (especially trauma-focused like EMDR or CBT) can be life-changing. Healing is possible at any age. Many people find profound healing as adults.',
        FALSE,
        68,
        TRUE,
        DATE_SUB(NOW(), INTERVAL 11 DAY)
    );
-- Verify insertion
SELECT COUNT(DISTINCT q.id) as 'Total Questions',
    COUNT(DISTINCT a.id) as 'Total Answers'
FROM qa_questions q
    LEFT JOIN qa_answers a ON q.id = a.question_id;