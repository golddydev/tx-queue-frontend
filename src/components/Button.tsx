// import types
import { ReactNode } from "react";

export interface Props {
  color: "primary" | "secondary";
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  startIcon?: ReactNode;
  className?: string;
}

const Button = ({
  color = "primary",
  text = "Button",
  onClick = () => {},
  disabled = false,
  loading = false,
  startIcon = null,
  className = "",
}: Props): JSX.Element => {
  const colorClassNames = {
    primary: `bg-cyan-500 text-white ${
      disabled ? "" : "hover:border-cyan-500 hover:text-cyan-500"
    }`,
    secondary: `bg-violet-500 text-white ${
      disabled ? "" : "hover:border-violet-500 hover:text-violet-500"
    }`,
  };

  return (
    <button
      className={`px-3 py-2 border-[2px] border-transparent duration-300 ${
        colorClassNames[color]
      } ${className} ${disabled ? "opacity-50" : "hover:bg-transparent"}`}
      onClick={onClick}
      disabled={loading || disabled}
    >
      <div className="flex items-center justify-center">
        {loading ? (
          "Loading..."
        ) : (
          <>
            {startIcon ? startIcon : <></>}
            <div className={`${startIcon ? "ml-2" : ""}`}>{text}</div>
          </>
        )}
      </div>
    </button>
  );
};

export default Button;
