-- Seed Support Groups for STILL STANDING
-- Run this after creating the support_groups table
-- First, we need a default system user for group creation
-- Insert a system user if it doesn't exist (id=1)
INSERT IGNORE INTO users (id, email, password, name, role, status)
VALUES (
        1,
        'system@stillstanding.org',
        '$2a$10$dummyhash',
        'STILL STANDING Team',
        'admin',
        'active'
    );
-- Insert seed support groups
INSERT INTO support_groups (
        name,
        description,
        topic,
        is_private,
        created_by,
        member_count,
        created_at
    )
VALUES (
        'Grief & Loss Support Circle',
        'A compassionate space for those navigating the difficult journey of grief. Share your story, find comfort, and heal together with others who understand.',
        'grief',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Recovery Warriors',
        'For those in recovery from addiction or substance abuse. Share struggles, celebrate victories, and support each other on the path to sobriety.',
        'addiction',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'PTSD Healing Community',
        'A safe haven for trauma survivors. Connect with others who understand the challenges of PTSD and learn coping strategies together.',
        'ptsd',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Anxiety Relief Circle',
        'Find peace and share strategies for managing anxiety. From panic attacks to generalized anxiety, we support each other through it all.',
        'anxiety',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Depression Support Network',
        'You are not alone in this darkness. Connect with others who understand depression and work together toward brighter days.',
        'depression',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Mindful Parents Club',
        'For parents navigating mental health challenges while raising children. Share experiences, find support, and grow together.',
        'parenting',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Relationship Healing Space',
        'Working through relationship challenges, breakups, or co-dependency. Find understanding and rebuild your emotional wellbeing.',
        'relationships',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Young Adults Mental Health',
        'For young adults (18-35) navigating life transitions, career stress, and mental health challenges unique to this life stage.',
        'anxiety',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Workplace Stress Warriors',
        'Dealing with burnout, job stress, or work-related anxiety? Share coping strategies and support each other through professional challenges.',
        'anxiety',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Grief After Suicide Loss',
        'For those who have lost someone to suicide. A specialized group offering understanding, compassion, and healing for this unique grief journey.',
        'grief',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Hope After Divorce',
        'Rebuilding life after divorce or separation. Share experiences, rediscover yourself, and find hope for the future.',
        'relationships',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Living with Chronic Illness',
        'For those managing mental health alongside chronic physical conditions. Find support for the unique challenges of chronic illness.',
        'depression',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'LGBTQ+ Mental Wellness',
        'A welcoming space for LGBTQ+ individuals to discuss mental health challenges and celebrate resilience together.',
        'other',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Caregivers Support Circle',
        'For those caring for loved ones with mental illness or chronic conditions. Your wellbeing matters too.',
        'parenting',
        FALSE,
        1,
        0,
        NOW()
    ),
    (
        'Healing from Abuse',
        'A safe space for survivors of emotional, physical, or psychological abuse. Find strength and support on your healing journey.',
        'ptsd',
        FALSE,
        1,
        0,
        NOW()
    );
-- Verify insertion
SELECT COUNT(*) as 'Total Groups Added'
FROM support_groups
WHERE created_by = 1;