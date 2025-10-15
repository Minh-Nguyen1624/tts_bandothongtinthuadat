import { createContext, useContext, useState } from "react";

// 1️⃣ Tạo context
const ThemeContext = createContext();

// 2️⃣ Provider component
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = { theme, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// 3️⃣ Custom hook
const useTheme = () => useContext(ThemeContext);

export { ThemeProvider, useTheme };
