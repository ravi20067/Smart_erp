export interface UserProfile {
    id?: number;
    userId?: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImage?: string;
}