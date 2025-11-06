"use client"

import { Geist } from "next/font/google";
import Image from "next/image"
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function BrewtifulLogo() {

  return (
    <Link href="/">
        <div
        className={`${geistSans.className} flex flex-row items-center leading-none text-[28px] sm:text-[36px] md:text-[44px]`}
        >
            <Image
            src="/transparent.svg"
            width={44}
            height={44}
            alt="Brewtiful Logo"
            className="h-[1.5em] mt-1 w-auto dark:hidden"
            />
            <Image
            src="/transparent-dark.svg"
            width={44}
            height={44}
            alt="Brewtiful Logo"
            className="h-[1.5em] mt-1 w-auto hidden dark:block"
            />
            <p className="hidden xs:block">Brewtiful</p>
        </div>
    </Link>

  );
}