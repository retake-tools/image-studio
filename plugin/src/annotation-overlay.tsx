import React, { type ReactElement } from 'react';
import {
  normalizedBounds,
  strokeBySize,
  type AnnotationMark,
} from './annotation';

export function AnnotationOverlayMark({
  mark,
  selected,
}: {
  mark: AnnotationMark;
  selected: boolean;
}): ReactElement {
  const strokeWidth = strokeBySize[mark.strokeSize] / 500;
  const className = selected ? 'is-selected' : undefined;
  if (mark.kind === 'marker') {
    return (
      <g
        className={className}
        data-annotation-mark-id={mark.id}
        transform={`translate(${mark.point.x} ${mark.point.y})`}
      >
        {selected ? (
          <circle
            className="retake-annotation-selection"
            cy={-0.035}
            r={0.034}
          />
        ) : null}
        <path
          d="M 0 0 C -0.01 -0.015 -0.029 -0.03 -0.029 -0.051 A 0.029 0.029 0 1 1 0.029 -0.051 C 0.029 -0.03 0.01 -0.015 0 0 Z"
          fill={mark.color}
          stroke="#fff"
          strokeWidth={0.004}
        />
        <text
          fill="#fff"
          fontSize={0.019}
          fontWeight={850}
          textAnchor="middle"
          y={-0.043}
        >
          {mark.id}
        </text>
      </g>
    );
  }
  if (mark.kind === 'arrow') {
    return (
      <g className={className} data-annotation-mark-id={mark.id}>
        {selected ? (
          <line
            className="retake-annotation-selection"
            strokeWidth={strokeWidth + 0.015}
            x1={mark.start.x}
            x2={mark.end.x}
            y1={mark.start.y}
            y2={mark.end.y}
          />
        ) : null}
        <line
          markerEnd={`url(#retake-annotation-arrow-${mark.color.slice(1)})`}
          stroke={mark.color}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          x1={mark.start.x}
          x2={mark.end.x}
          y1={mark.start.y}
          y2={mark.end.y}
        />
        <AnnotationBadge mark={mark} />
        {selected ? (
          <>
            <EndpointHandle point={mark.start} />
            <EndpointHandle point={mark.end} />
          </>
        ) : null}
      </g>
    );
  }
  if (mark.kind === 'pen' || mark.kind === 'brush') {
    const points = mark.points.map((point) => (
      `${point.x},${point.y}`
    )).join(' ');
    const pathWidth = mark.kind === 'brush'
      ? strokeWidth * 8
      : strokeWidth;
    return (
      <g className={className} data-annotation-mark-id={mark.id}>
        {selected ? (
          <polyline
            className="retake-annotation-selection"
            fill="none"
            points={points}
            strokeWidth={pathWidth + 0.015}
          />
        ) : null}
        <polyline
          fill="none"
          opacity={mark.kind === 'brush' ? 0.38 : 1}
          points={points}
          stroke={mark.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={pathWidth}
        />
        {mark.points.length === 1 ? (
          <circle
            cx={mark.points[0]?.x}
            cy={mark.points[0]?.y}
            fill={mark.color}
            opacity={mark.kind === 'brush' ? 0.38 : 1}
            r={pathWidth / 2}
          />
        ) : null}
        <AnnotationBadge mark={mark} />
      </g>
    );
  }
  const bounds = normalizedBounds(mark.start, mark.end);
  if (mark.kind === 'ellipse') {
    return (
      <g className={className} data-annotation-mark-id={mark.id}>
        {selected ? (
          <ellipse
            className="retake-annotation-selection"
            cx={bounds.x + bounds.width / 2}
            cy={bounds.y + bounds.height / 2}
            rx={bounds.width / 2}
            ry={bounds.height / 2}
            strokeWidth={strokeWidth + 0.015}
          />
        ) : null}
        <ellipse
          cx={bounds.x + bounds.width / 2}
          cy={bounds.y + bounds.height / 2}
          fill="none"
          rx={bounds.width / 2}
          ry={bounds.height / 2}
          stroke={mark.color}
          strokeWidth={strokeWidth}
        />
        <AnnotationBadge mark={mark} />
      </g>
    );
  }
  return (
    <g className={className} data-annotation-mark-id={mark.id}>
      {selected ? (
        <rect
          className="retake-annotation-selection"
          height={bounds.height}
          strokeWidth={strokeWidth + 0.015}
          width={bounds.width}
          x={bounds.x}
          y={bounds.y}
        />
      ) : null}
      <rect
        fill="none"
        height={bounds.height}
        stroke={mark.color}
        strokeWidth={strokeWidth}
        width={bounds.width}
        x={bounds.x}
        y={bounds.y}
      />
      <AnnotationBadge mark={mark} />
      {selected ? (
        <>
          <EndpointHandle point={mark.start} />
          <EndpointHandle point={mark.end} />
          <EndpointHandle point={{ x: mark.start.x, y: mark.end.y }} />
          <EndpointHandle point={{ x: mark.end.x, y: mark.start.y }} />
        </>
      ) : null}
    </g>
  );
}

function EndpointHandle({
  point,
}: {
  point: { x: number; y: number };
}): ReactElement {
  return (
    <circle
      className="retake-annotation-endpoint"
      cx={point.x}
      cy={point.y}
      r={0.011}
    />
  );
}

function AnnotationBadge({
  mark,
}: {
  mark: Exclude<AnnotationMark, { kind: 'marker' }>;
}): ReactElement {
  const anchor = mark.kind === 'pen' || mark.kind === 'brush'
    ? mark.points[0] ?? { x: 0.5, y: 0.5 }
    : mark.start;
  return (
    <g transform={`translate(${anchor.x} ${anchor.y})`}>
      <circle
        fill={mark.color}
        r={0.023}
        stroke="#fff"
        strokeWidth={0.004}
      />
      <text
        fill="#fff"
        fontSize={0.017}
        fontWeight={850}
        textAnchor="middle"
        y={0.006}
      >
        {mark.id}
      </text>
    </g>
  );
}

export function AnnotationArrowDefinitions(): ReactElement {
  return (
    <defs>
      {['dc2626', 'facc15', '22c55e', '2563eb', 'a855f7'].map((color) => (
        <marker
          id={`retake-annotation-arrow-${color}`}
          key={color}
          markerHeight="7"
          markerUnits="strokeWidth"
          markerWidth="7"
          orient="auto"
          refX="6"
          refY="3.5"
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill={`#${color}`} />
        </marker>
      ))}
    </defs>
  );
}
