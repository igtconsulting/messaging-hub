// DashboardCardColored.tsx
import { SVGProps } from "react";
import Loading from "../General/Loading";

type Props = {
  icon: React.FC<SVGProps<SVGSVGElement>>;
  text: string;
  number: number | string;
  color: string;
  loading: boolean;
};

const DashboardCardColored: React.FC<Props> = ({
  icon: Icon,
  text,
  number,
  color,
  loading,
}) => {
  return (
    <div className="relative">
      <img src={color} className="rounded-md max-h-80" alt={text} />
      <div className="absolute top-0 left-0 right-0 bottom-0 flex items-start justify-end pt-4 pr-4">
        <Icon className="text-white opacity-80 w-20 md:w-10 lg:w-20 h-auto" />
      </div>
      <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col justify-end pb-8 md:pb-6 lg:pb-8 pl-6 space-y-4">
        <div className="text-white text-5xl md:text-3xl lg:text-5xl font-semibold">
          {loading ? <Loading color="white" /> : number}
        </div>
        <p className="text-white text-redactor md:text-base lg:text-redactor font-semibold">
          {text}
        </p>
      </div>
    </div>
  );
};

export default DashboardCardColored;
