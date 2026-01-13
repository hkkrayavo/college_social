import { Role, User, UserRole, GroupType, Group, UserGroup, Post, PostGroup, Event, EventGroup, Album, Comment, Like } from '../models/index.js'

// Simplified roles: admin and user only
const defaultRoles = [
    {
        name: 'admin',
        description: 'Full administrative access',
        canPostWithoutApproval: true,
        canModeratePosts: true,
        canManageUsers: true,
        canManageGroups: true,
        canManageAlbums: true,
        canViewAllContent: true,
    },
    {
        name: 'user',
        description: 'Regular user',
        canPostWithoutApproval: false,
        canModeratePosts: false,
        canManageUsers: false,
        canManageGroups: false,
        canManageAlbums: false,
        canViewAllContent: false,
    },
]

// Default group types
const defaultGroupTypes = [
    { label: 'Batch', description: 'Academic batch groups (e.g., 2024 Batch)' },
    { label: 'Department', description: 'Department-wise groups' },
    { label: 'Club', description: 'Clubs and societies' },
    { label: 'Course', description: 'Course-specific groups' },
    { label: 'Event', description: 'Event-specific groups' },
]

// Sample users data
const sampleUsers = [
    { name: 'Rahul Sharma', mobileNumber: '9876543210', email: 'rahul.sharma@example.com', role: 'user' },
    { name: 'Priya Patel', mobileNumber: '9876543211', email: 'priya.patel@example.com', role: 'user' },
    { name: 'Amit Kumar', mobileNumber: '9876543212', email: 'amit.kumar@example.com', role: 'user' },
    { name: 'Sneha Gupta', mobileNumber: '9876543213', email: 'sneha.gupta@example.com', role: 'user' },
    { name: 'Vikram Singh', mobileNumber: '9876543214', email: 'vikram.singh@example.com', role: 'user' },
    { name: 'Ananya Reddy', mobileNumber: '9876543215', email: 'ananya.reddy@example.com', role: 'user' },
    { name: 'Rohit Verma', mobileNumber: '9876543216', email: 'rohit.verma@example.com', role: 'user' },
    { name: 'Kavita Nair', mobileNumber: '9876543217', email: 'kavita.nair@example.com', role: 'user' },
    { name: 'Dr. Suresh Iyer', mobileNumber: '9876543218', email: 'suresh.iyer@example.com', role: 'user' },
    { name: 'Prof. Meena Krishnan', mobileNumber: '9876543219', email: 'meena.krishnan@example.com', role: 'user' },
]

// Sample groups data
const sampleGroups = [
    { name: 'B.Tech 2024', type: 'Batch', description: 'All students from B.Tech 2024 batch' },
    { name: 'B.Tech 2025', type: 'Batch', description: 'All students from B.Tech 2025 batch' },
    { name: 'Computer Science', type: 'Department', description: 'Computer Science & Engineering Department' },
    { name: 'Electronics', type: 'Department', description: 'Electronics & Communication Department' },
    { name: 'Mechanical', type: 'Department', description: 'Mechanical Engineering Department' },
    { name: 'Coding Club', type: 'Club', description: 'For programming enthusiasts and competitive coders' },
    { name: 'Photography Club', type: 'Club', description: 'Capture moments, share perspectives' },
    { name: 'Sports Club', type: 'Club', description: 'All sports activities and events' },
    { name: 'Music Society', type: 'Club', description: 'For music lovers and performers' },
    { name: 'Data Structures & Algorithms', type: 'Course', description: 'DSA course discussion group' },
]

// Sample events data
const sampleEvents = [
    { name: 'Tech Fest 2026', date: new Date('2026-02-15'), endDate: new Date('2026-02-17'), startTime: '09:00', endTime: '18:00', description: 'Annual technical festival with competitions, workshops, and exhibitions' },
    { name: 'Cultural Night', date: new Date('2026-03-10'), endDate: null, startTime: '18:00', endTime: '22:00', description: 'Annual cultural celebration with music, dance, and drama performances' },
    { name: 'Hackathon 2026', date: new Date('2026-01-25'), endDate: new Date('2026-01-26'), startTime: '10:00', endTime: '10:00', description: '24-hour coding marathon to build innovative solutions' },
    { name: 'Sports Day', date: new Date('2026-02-28'), endDate: null, startTime: '08:00', endTime: '17:00', description: 'Annual inter-department sports competition' },
    { name: 'Alumni Meet', date: new Date('2026-04-05'), endDate: null, startTime: '10:00', endTime: '16:00', description: 'Annual gathering of alumni and current students' },
    { name: 'Workshop: AI & ML', date: new Date('2026-01-20'), endDate: null, startTime: '14:00', endTime: '17:00', description: 'Introduction to Artificial Intelligence and Machine Learning' },
]

// Sample posts content (Editor.js format)
const samplePosts = [
    {
        title: 'Welcome to the New Semester! 🎓',
        content: {
            blocks: [
                { type: 'header', data: { text: 'Welcome Back Everyone!', level: 2 } },
                { type: 'paragraph', data: { text: 'Hope everyone had a great break! Excited to start this new semester with all of you. Let\'s make this one the best yet!' } },
                { type: 'paragraph', data: { text: 'Don\'t forget to check the upcoming events and join the clubs that interest you. See you around campus! 👋' } }
            ]
        }
    },
    {
        title: 'Hackathon 2026 Registration Open! 💻',
        content: {
            blocks: [
                { type: 'header', data: { text: '24-Hour Hackathon Coming Soon!', level: 2 } },
                { type: 'paragraph', data: { text: 'Get ready for the biggest coding event of the year! Form your teams and register now.' } },
                { type: 'list', data: { style: 'unordered', items: ['Team size: 2-4 members', 'Registration deadline: Jan 20', 'Prizes worth ₹50,000!'] } },
                { type: 'paragraph', data: { text: 'Contact the Coding Club for more details. Let\'s build something amazing! 🚀' } }
            ]
        }
    },
    {
        title: 'Photography Contest Winners Announced 📸',
        content: {
            blocks: [
                { type: 'paragraph', data: { text: 'Congratulations to all the winners of our monthly photography contest! The theme was "Campus Life" and we received over 50 amazing entries.' } },
                { type: 'paragraph', data: { text: '🥇 First Place: Sunset at the Library - by Ananya\n🥈 Second Place: Morning Fog - by Vikram\n🥉 Third Place: Friends Forever - by Sneha' } },
                { type: 'paragraph', data: { text: 'Next month\'s theme will be announced soon. Keep clicking!' } }
            ]
        }
    },
    {
        title: 'DSA Study Group - Week 3 Summary',
        content: {
            blocks: [
                { type: 'header', data: { text: 'Topics Covered This Week', level: 2 } },
                { type: 'list', data: { style: 'ordered', items: ['Binary Search Trees', 'AVL Trees', 'Graph Basics - BFS & DFS'] } },
                { type: 'paragraph', data: { text: 'Great session everyone! The recordings are uploaded to our shared drive. Next week we\'ll dive into Dynamic Programming.' } },
                { type: 'paragraph', data: { text: 'Practice problems have been shared in the group. Try to solve at least 5 before next session! 📚' } }
            ]
        }
    },
    {
        title: 'Sports Day Volunteers Needed! 🏆',
        content: {
            blocks: [
                { type: 'paragraph', data: { text: 'We need enthusiastic volunteers for the upcoming Sports Day on Feb 28th!' } },
                { type: 'list', data: { style: 'unordered', items: ['Event coordinators', 'Scorekeepers', 'Refreshment team', 'Photography team'] } },
                { type: 'paragraph', data: { text: 'Volunteers will receive certificates and free meals. Register with the Sports Club by Feb 20th.' } }
            ]
        }
    },
    {
        title: 'New Library Timings Effective Immediately 📖',
        content: {
            blocks: [
                { type: 'paragraph', data: { text: 'The library will now be open for extended hours during exam season!' } },
                { type: 'paragraph', data: { text: 'New Timings:\n• Weekdays: 7 AM - 11 PM\n• Weekends: 8 AM - 10 PM\n• 24/7 access during finals week' } },
                { type: 'paragraph', data: { text: 'Make the most of these extended hours. Happy studying! 📚' } }
            ]
        }
    },
    {
        title: 'Music Society Auditions This Friday 🎵',
        content: {
            blocks: [
                { type: 'header', data: { text: 'Join the Music Society!', level: 2 } },
                { type: 'paragraph', data: { text: 'Whether you sing, play an instrument, or just love music - we want YOU!' } },
                { type: 'paragraph', data: { text: 'Auditions: Friday, 4 PM at the Auditorium\nNo prior experience required for joining as a member.\n\nWe perform at all major college events and organize jam sessions every week. 🎸' } }
            ]
        }
    },
    {
        title: 'Internship Opportunities at Tech Giants',
        content: {
            blocks: [
                { type: 'paragraph', data: { text: 'The placement cell has announced new internship openings!' } },
                { type: 'list', data: { style: 'unordered', items: ['Google - SDE Intern (Summer 2026)', 'Microsoft - PM Intern', 'Amazon - SDE Intern', 'Flipkart - Data Science Intern'] } },
                { type: 'paragraph', data: { text: 'Eligibility: CGPA > 7.0, No active backlogs\nDeadline: Jan 25th\n\nPrepare well and all the best! 💪' } }
            ]
        }
    },
]

// Sample comments
const sampleComments = [
    'This is amazing! Can\'t wait! 🎉',
    'Thanks for sharing this information!',
    'Count me in! 🙋',
    'Great initiative! 👏',
    'Very helpful, thank you!',
    'Looking forward to this!',
    'Awesome work everyone! 🌟',
    'This is exactly what we needed!',
    'Keep up the great work! 💪',
    'Really informative post!',
]

export async function seedDatabase() {
    console.log('🌱 Starting database seed...')

    // Seed Roles
    console.log('   Creating roles...')
    for (const roleData of defaultRoles) {
        await Role.findOrCreate({
            where: { name: roleData.name },
            defaults: roleData,
        })
    }
    console.log(`   ✓ ${defaultRoles.length} roles created/verified`)

    // Seed Group Types
    console.log('   Creating group types...')
    const groupTypeMap: Record<string, string> = {}
    for (const typeData of defaultGroupTypes) {
        const [groupType] = await GroupType.findOrCreate({
            where: { label: typeData.label },
            defaults: typeData,
        })
        groupTypeMap[typeData.label] = groupType.id
    }
    console.log(`   ✓ ${defaultGroupTypes.length} group types created/verified`)

    // Create default admin user if not exists
    console.log('   Creating default admin user...')
    const adminRole = await Role.findOne({ where: { name: 'admin' } })

    const [adminUser, adminCreated] = await User.findOrCreate({
        where: { mobileNumber: '9999999999' },
        defaults: {
            name: 'System Admin',
            mobileNumber: '9999999999',
            email: 'admin@college.edu',
            status: 'approved',
            createdByAdmin: true,
            firstLoginComplete: true,
        },
    })

    if (adminCreated && adminRole) {
        await UserRole.findOrCreate({
            where: { userId: adminUser.id, roleId: adminRole.id },
            defaults: {
                userId: adminUser.id,
                roleId: adminRole.id,
                assignedAt: new Date(),
            },
        })
        console.log('   ✓ Default admin created (Phone: 9999999999)')
    } else {
        console.log('   ✓ Admin user already exists')
    }

    // Create sample users
    console.log('   Creating sample users...')
    const createdUsers: User[] = [adminUser]
    for (const userData of sampleUsers) {
        const role = await Role.findOne({ where: { name: userData.role } })
        const [user, created] = await User.findOrCreate({
            where: { mobileNumber: userData.mobileNumber },
            defaults: {
                name: userData.name,
                mobileNumber: userData.mobileNumber,
                email: userData.email,
                status: 'approved',
                createdByAdmin: true,
                firstLoginComplete: true,
            },
        })

        if (created && role) {
            await UserRole.findOrCreate({
                where: { userId: user.id, roleId: role.id },
                defaults: { userId: user.id, roleId: role.id, assignedAt: new Date() },
            })
        }
        createdUsers.push(user)
    }
    console.log(`   ✓ ${sampleUsers.length} sample users created/verified`)

    // Create sample groups
    console.log('   Creating sample groups...')
    const createdGroups: Group[] = []
    for (const groupData of sampleGroups) {
        const groupTypeId = groupTypeMap[groupData.type]
        const [group] = await Group.findOrCreate({
            where: { name: groupData.name },
            defaults: {
                name: groupData.name,
                description: groupData.description,
                groupTypeId,
                createdBy: adminUser.id,
            },
        })
        createdGroups.push(group)
    }
    console.log(`   ✓ ${sampleGroups.length} sample groups created/verified`)

    // Assign users to groups (random assignment)
    console.log('   Assigning users to groups...')
    for (const user of createdUsers) {
        // Each user joins 2-4 random groups
        const numGroups = 2 + Math.floor(Math.random() * 3)
        const shuffledGroups = [...createdGroups].sort(() => Math.random() - 0.5)
        for (let i = 0; i < Math.min(numGroups, shuffledGroups.length); i++) {
            await UserGroup.findOrCreate({
                where: { userId: user.id, groupId: shuffledGroups[i].id },
                defaults: { userId: user.id, groupId: shuffledGroups[i].id },
            })
        }
    }
    console.log('   ✓ Users assigned to groups')

    // Create sample events
    console.log('   Creating sample events...')
    const createdEvents: Event[] = []
    for (const eventData of sampleEvents) {
        const [event] = await Event.findOrCreate({
            where: { name: eventData.name },
            defaults: {
                ...eventData,
                createdBy: adminUser.id,
            },
        })
        createdEvents.push(event)

        // Assign event to 1-2 random groups
        const numGroups = 1 + Math.floor(Math.random() * 2)
        const shuffledGroups = [...createdGroups].sort(() => Math.random() - 0.5)
        for (let i = 0; i < numGroups; i++) {
            await EventGroup.findOrCreate({
                where: { eventId: event.id, groupId: shuffledGroups[i].id },
                defaults: { eventId: event.id, groupId: shuffledGroups[i].id },
            })
        }
    }
    console.log(`   ✓ ${sampleEvents.length} sample events created/verified`)

    // Create sample albums for events
    console.log('   Creating sample albums...')
    for (const event of createdEvents.slice(0, 3)) {
        await Album.findOrCreate({
            where: { name: `${event.name} - Photos` },
            defaults: {
                name: `${event.name} - Photos`,
                description: `Photo gallery for ${event.name}`,
                eventId: event.id,
                createdBy: adminUser.id,
            },
        })
    }
    console.log('   ✓ Sample albums created')

    // Create sample posts
    console.log('   Creating sample posts...')
    const createdPosts: Post[] = []
    for (let i = 0; i < samplePosts.length; i++) {
        const postData = samplePosts[i]
        const author = createdUsers[i % createdUsers.length]

        const [post, created] = await Post.findOrCreate({
            where: { title: postData.title },
            defaults: {
                title: postData.title,
                content: JSON.stringify(postData.content),
                authorId: author.id,
                status: 'approved',
                reviewedBy: adminUser.id,
                reviewedAt: new Date(),
            },
        })
        createdPosts.push(post)

        // Assign post to 1-2 random groups
        if (created) {
            const numGroups = 1 + Math.floor(Math.random() * 2)
            const shuffledGroups = [...createdGroups].sort(() => Math.random() - 0.5)
            for (let j = 0; j < numGroups; j++) {
                await PostGroup.findOrCreate({
                    where: { postId: post.id, groupId: shuffledGroups[j].id },
                    defaults: { postId: post.id, groupId: shuffledGroups[j].id },
                })
            }
        }
    }
    console.log(`   ✓ ${samplePosts.length} sample posts created/verified`)

    // Create sample comments
    console.log('   Creating sample comments...')
    for (const post of createdPosts) {
        // Each post gets 1-4 random comments
        const numComments = 1 + Math.floor(Math.random() * 4)
        for (let i = 0; i < numComments; i++) {
            const commenter = createdUsers[Math.floor(Math.random() * createdUsers.length)]
            const commentText = sampleComments[Math.floor(Math.random() * sampleComments.length)]

            await Comment.findOrCreate({
                where: { commentableType: 'post', commentableId: post.id, userId: commenter.id, content: commentText },
                defaults: {
                    commentableType: 'post',
                    commentableId: post.id,
                    userId: commenter.id,
                    content: commentText,
                },
            })
        }
    }
    console.log('   ✓ Sample comments created')

    // Create sample likes
    console.log('   Creating sample likes...')
    for (const post of createdPosts) {
        // Each post gets 2-8 random likes
        const numLikes = 2 + Math.floor(Math.random() * 7)
        const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5)
        for (let i = 0; i < Math.min(numLikes, shuffledUsers.length); i++) {
            await Like.findOrCreate({
                where: { userId: shuffledUsers[i].id, likeableType: 'post', likeableId: post.id },
                defaults: {
                    userId: shuffledUsers[i].id,
                    likeableType: 'post',
                    likeableId: post.id,
                },
            })
        }
    }
    console.log('   ✓ Sample likes created')

    console.log('🌱 Database seed complete!')
    console.log('')
    console.log('📋 Sample Data Summary:')
    console.log(`   • ${createdUsers.length} users (including admin)`)
    console.log(`   • ${createdGroups.length} groups`)
    console.log(`   • ${createdEvents.length} events`)
    console.log(`   • ${createdPosts.length} posts with comments and likes`)
    console.log('')
    console.log('🔐 Login Credentials:')
    console.log('   Admin: 9999999999')
    console.log('   Sample Student: 9876543210 (Rahul Sharma)')
    console.log('   Sample Faculty: 9876543218 (Dr. Suresh Iyer)')
}
