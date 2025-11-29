// Navbar.tsx

import { dummyUser } from "@/lib/DummyData";
import { useAuthStore } from "@/store/userStore";

export default function Navbar() {
  const userInfo = useAuthStore((state) => state.userInfo);
  const setUserInfo = useAuthStore((state) => state.setUserInfo);
  const clearUserInfo = useAuthStore((state) => state.clearUserInfo);

  // 登陆&登出函数
  function handleAuthAction() {
    if (userInfo) {
      clearUserInfo(); // 登出
    } else {
      setUserInfo(dummyUser); // Dummy登陆
    }
  }

  return (
    <nav className="absolute top-0 left-0 w-full bg-black/70 backdrop-blur-sm border-b border-gray-800 px-8 py-4 flex items-center justify-between z-50">
      <div className="text-2xl font-semibold tracking-wide text-white select-none">
        SCOPE
      </div>
      <div className="flex space-x-10 text-sm font-medium items-center">
        {["Projects", "Docs", "Github"].map((item) => (
          <a
            key={item}
            href="#"
            className="relative text-gray-300 hover:text-white transition-colors after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1.5px] after:bg-white after:scale-x-0 after:origin-left after:transition-transform hover:after:scale-x-100"
          >
            {item}
          </a>
        ))}

        {/* 登录/登出按钮 */}
        <button
          onClick={handleAuthAction}
          className="ml-6 px-4 py-1 rounded bg-gray-200 text-gray-900 font-semibold hover:bg-gray-300 hover:cursor-pointer transition"
        >
          {userInfo ? `Logout (${userInfo.username})` : "Login"}
        </button>
      </div>
    </nav>
  );
}
