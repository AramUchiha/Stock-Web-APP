"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp
} from "lightweight-charts";
import { CHART_RANGES, type Candle, type ChartRange } from "@/lib/integrations/market-data/types";
import { cn } from "@/lib/utils";

type StockChartProps = {
  ticker: string;
  initialRange?: ChartRange;
};

const BULLISH = "#10B981";
const BEARISH = "#EF4444";

export function StockChart({ ticker, initialRange = "1M" }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [range, setRange] = useState<ChartRange>(initialRange);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
        fontFamily: "var(--font-mono), monospace"
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" }
      },
      rightPriceScale: { borderColor: "#1F1F1F" },
      timeScale: { borderColor: "#1F1F1F", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0 },
      autoSize: true
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: BULLISH,
      downColor: BEARISH,
      borderUpColor: BULLISH,
      borderDownColor: BEARISH,
      wickUpColor: BULLISH,
      wickDownColor: BEARISH
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: ""
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/market/candles?ticker=${encodeURIComponent(ticker)}&range=${range}`, {
          signal: controller.signal
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load chart data.");
        }

        setCandles(data.candles ?? []);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load chart data.");
          setCandles([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [ticker, range]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries) {
      return;
    }

    const candleData: CandlestickData[] = candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close
    }));

    const volumeData: HistogramData[] = candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      value: candle.volume,
      color: candle.close >= candle.open ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"
    }));

    candleSeries.setData(candleData);
    volumeSeries.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CHART_RANGES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            className={cn(
              "rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-colors",
              range === option ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="relative">
        <div ref={containerRef} className="h-[320px] w-full sm:h-[420px]" />

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">Loading chart...</div>
        ) : null}

        {error && !isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            No chart data available for {ticker}.
          </div>
        ) : null}
      </div>
    </div>
  );
}
