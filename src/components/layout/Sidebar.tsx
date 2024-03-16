import Link from "next/link";
import React from "react";

const Sidebar = () => {
  return (
    <div className="h-full w-48 bg-gray-50 text-black">
      <div className="p-5">Tenant Ledger</div>
      <ul className="space-y-2">
        <li>
          <Link href="/" className="block p-4 hover:bg-gray-700">
            Home
          </Link>
        </li>
        <li>
          <Link href="/signin" className="block p-4 hover:bg-gray-700">
            Sign In
          </Link>
        </li>
        <li>
          <Link href="/worldcoin" className="block p-4 hover:bg-gray-700">
            Worldcoin
          </Link>
        </li>
        {/* Add more navigation items here */}
      </ul>
    </div>
  );
};

export default Sidebar;
