import Link from "next/link";

export default function Footer() {

    return <footer>
        <p>RailTrail is a product. <Link className="text-blue-600 visited:text-purple-700" href="/data_protection">Data Protection</Link></p>
    </footer>
}