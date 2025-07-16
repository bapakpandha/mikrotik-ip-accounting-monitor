"use client";

import React from "react";

export interface UserAvatarProps {
    username: string;
    HrefUrl?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ username, HrefUrl }) => {
    return (
        <div className = "flex flex-col items-center gap-4" >
            <div className="relative my-4">
                <div className="relative w-24 h-24 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                    <svg className="absolute w-28 h-28 text-gray-400 -left-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                </div>
            </div>
            <p className="text-2xl font-bold dark:text-white/90">
                {username}
            </p>
        </div >
    );
}