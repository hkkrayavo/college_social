// Model exports and associations
import { Role } from './Role.js'
import { User } from './User.js'
import { UserRole } from './UserRole.js'
import { OtpVerification } from './OtpVerification.js'
import { GroupType } from './GroupType.js'
import { Group } from './Group.js'
import { UserGroup } from './UserGroup.js'
import { Post } from './Post.js'
import { PostMedia } from './PostMedia.js'
import { PostGroup } from './PostGroup.js'
import { Event } from './Event.js'
import { Album } from './Album.js'
import { AlbumMedia } from './AlbumMedia.js'
import { AlbumGroup } from './AlbumGroup.js'
import EventGroup from './EventGroup.js'
import { Comment } from './Comment.js'
import { Like } from './Like.js'
import { Notification } from './Notification.js'
import { SiteSettings } from './SiteSettings.js'

// ==========================================
// Define Associations
// ==========================================

// User <-> Role (Many-to-Many through UserRole)
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', as: 'roles' })
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', as: 'users' })

// Group -> GroupType (Many-to-One)
Group.belongsTo(GroupType, { foreignKey: 'groupTypeId', as: 'groupType' })
GroupType.hasMany(Group, { foreignKey: 'groupTypeId', as: 'groups' })

// Group -> User (creator)
Group.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' })

// User <-> Group (Many-to-Many through UserGroup)
User.belongsToMany(Group, { through: UserGroup, foreignKey: 'userId', as: 'groups' })
Group.belongsToMany(User, { through: UserGroup, foreignKey: 'groupId', as: 'members' })

// Post -> User (author)
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' })
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' })

// Post -> User (reviewer)
Post.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' })

// Post -> PostMedia (One-to-Many)
Post.hasMany(PostMedia, { foreignKey: 'postId', as: 'media' })
PostMedia.belongsTo(Post, { foreignKey: 'postId', as: 'post' })

// Post <-> Group (Many-to-Many through PostGroup)
Post.belongsToMany(Group, { through: PostGroup, foreignKey: 'postId', as: 'groups' })
Group.belongsToMany(Post, { through: PostGroup, foreignKey: 'groupId', as: 'posts' })

// Event -> User (creator)
Event.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' })
User.hasMany(Event, { foreignKey: 'createdBy', as: 'events' })

// Event -> Album (One-to-Many)
Event.hasMany(Album, { foreignKey: 'eventId', as: 'albums' })
Album.belongsTo(Event, { foreignKey: 'eventId', as: 'event' })

// Event <-> Group (Many-to-Many through EventGroup)
Event.belongsToMany(Group, { through: EventGroup, foreignKey: 'eventId', as: 'groups' })
Group.belongsToMany(Event, { through: EventGroup, foreignKey: 'groupId', as: 'events' })

// Album -> User (creator)
Album.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' })
User.hasMany(Album, { foreignKey: 'createdBy', as: 'createdAlbums' })

// Album -> AlbumMedia (One-to-Many)
Album.hasMany(AlbumMedia, { foreignKey: 'albumId', as: 'media' })
AlbumMedia.belongsTo(Album, { foreignKey: 'albumId', as: 'album' })

// Album <-> Group (Many-to-Many through AlbumGroup)
Album.belongsToMany(Group, { through: AlbumGroup, foreignKey: 'albumId', as: 'groups' })
Group.belongsToMany(Album, { through: AlbumGroup, foreignKey: 'groupId', as: 'albums' })

// Comment -> User (Many-to-One)
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' })
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' })

// Like -> User (Many-to-One)
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasMany(Like, { foreignKey: 'userId', as: 'likes' })

// Notification -> User (Many-to-One)
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' })

// Export all models
export {
    Role,
    User,
    UserRole,
    OtpVerification,
    GroupType,
    Group,
    UserGroup,
    Post,
    PostMedia,
    PostGroup,
    Event,
    Album,
    AlbumMedia,
    AlbumGroup,
    EventGroup,
    Comment,
    Like,
    Notification,
    SiteSettings,
}
