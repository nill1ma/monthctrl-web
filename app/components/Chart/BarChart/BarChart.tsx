import { BarChart } from '@mui/x-charts/BarChart';

type BarChartProps = {
  id: string;
  dataAxis: string[];
  data: number[];
  className?: string;
};

export default function BarChartComponent({
  id,
  dataAxis,
  data,
  className,
}: BarChartProps) {
  return (
    <BarChart
    yAxis={[
      {
        tickLabelStyle: { fill: '#ffffff' },
      },
    ]}
    xAxis={[
      {
        id,
        data: dataAxis,
        height: 10,
        tickLabelStyle: { fill: '#ffffff' },
        colorMap: {
          type: 'continuous',
          color: ['#a3e635', '#a3e635'],
        },
      },
    ]}
    series={[
      {
        data,
      },
    ]}
    width={700}
    height={250}
    className={`${className}`}
    />
  );
}
