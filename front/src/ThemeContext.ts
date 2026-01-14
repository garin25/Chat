import { createContext } from 'react';
// Crea un objeto Context, con 'light' como valor por defecto
interface ThemeContextType{
    theme:string,
    toggleTheme:()=>void
}
const ThemeContext = createContext<ThemeContextType>({
    theme:"light",
    toggleTheme:()=>{}
});

export default ThemeContext;
