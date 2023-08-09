import Link from "next/link";

export default function Footer() {

    return <footer>
        <p>RailTrail is a product. <Link href={"/data_protection"}>Data Protection</Link></p>
    </footer>
}