import React, { type ReactElement } from 'react';
import {
  annotationBrushStrokeWidthPixels,
  normalizedBounds,
  strokeBySize,
  type AnnotationMark,
} from './annotation';

const annotationLocationMarkerPath =
  'M 0 0 C -0.009 -0.014 -0.027 -0.028 -0.027 -0.047 '
  + 'A 0.027 0.027 0 1 1 0.027 -0.047 '
  + 'C 0.027 -0.028 0.009 -0.014 0 0 Z';

export function AnnotationOverlayMark({
  imageHeight,
  imageWidth,
  mark,
  selected,
}: {
  imageHeight: number;
  imageWidth: number;
  mark: AnnotationMark;
  selected: boolean;
}): ReactElement {
  const strokeWidth = strokeBySize[mark.strokeSize];
  const fixedShapeYScale = imageWidth / imageHeight;
  const className = selected ? 'is-selected' : undefined;

  if (mark.kind === 'marker') {
    return (
      <g
        className={className}
        data-annotation-mark-id={mark.id}
        transform={
          `translate(${mark.point.x} ${mark.point.y}) `
          + `scale(1 ${fixedShapeYScale})`
        }
      >
        {selected ? (
          <path
            className="retake-annotation-marker-selection"
            d={annotationLocationMarkerPath}
          />
        ) : null}
        <path
          d={annotationLocationMarkerPath}
          fill={mark.color}
          stroke="#fff"
          strokeLinejoin="round"
          strokeWidth={0.004}
        />
        <text
          fill="#fff"
          fontSize={mark.id.length > 2 ? 0.016 : 0.019}
          fontWeight={850}
          textAnchor="middle"
          y={-0.04}
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
            strokeWidth={strokeWidth + 4}
            vectorEffect="non-scaling-stroke"
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
          vectorEffect="non-scaling-stroke"
          x1={mark.start.x}
          x2={mark.end.x}
          y1={mark.start.y}
          y2={mark.end.y}
        />
        <AnnotationBadge fixedShapeYScale={fixedShapeYScale} mark={mark} />
        {selected ? (
          <>
            <EndpointHandle
              fixedShapeYScale={fixedShapeYScale}
              point={mark.start}
            />
            <EndpointHandle
              fixedShapeYScale={fixedShapeYScale}
              point={mark.end}
            />
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
      ? annotationBrushStrokeWidthPixels(
          mark.strokeSize,
          imageWidth,
          imageHeight,
        )
      : strokeWidth;
    return (
      <g className={className} data-annotation-mark-id={mark.id}>
        {selected ? (
          <polyline
            className="retake-annotation-selection"
            fill="none"
            points={points}
            strokeWidth={pathWidth + 4}
            vectorEffect="non-scaling-stroke"
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
          vectorEffect="non-scaling-stroke"
        />
        {mark.points.length === 1 ? (
          <line
            x1={mark.points[0]?.x}
            x2={mark.points[0]?.x}
            y1={mark.points[0]?.y}
            y2={mark.points[0]?.y}
            opacity={mark.kind === 'brush' ? 0.38 : 1}
            stroke={mark.color}
            strokeLinecap="round"
            strokeWidth={pathWidth}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <AnnotationBadge fixedShapeYScale={fixedShapeYScale} mark={mark} />
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
            strokeWidth={strokeWidth + 4}
            vectorEffect="non-scaling-stroke"
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
          vectorEffect="non-scaling-stroke"
        />
        <AnnotationBadge fixedShapeYScale={fixedShapeYScale} mark={mark} />
      </g>
    );
  }

  return (
    <g className={className} data-annotation-mark-id={mark.id}>
      {selected ? (
        <rect
          className="retake-annotation-selection"
          height={bounds.height}
          strokeWidth={strokeWidth + 4}
          vectorEffect="non-scaling-stroke"
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
        vectorEffect="non-scaling-stroke"
        width={bounds.width}
        x={bounds.x}
        y={bounds.y}
      />
      <AnnotationBadge fixedShapeYScale={fixedShapeYScale} mark={mark} />
      {selected ? (
        <>
          <EndpointHandle
            fixedShapeYScale={fixedShapeYScale}
            point={mark.start}
          />
          <EndpointHandle
            fixedShapeYScale={fixedShapeYScale}
            point={mark.end}
          />
          <EndpointHandle
            fixedShapeYScale={fixedShapeYScale}
            point={{ x: mark.start.x, y: mark.end.y }}
          />
          <EndpointHandle
            fixedShapeYScale={fixedShapeYScale}
            point={{ x: mark.end.x, y: mark.start.y }}
          />
        </>
      ) : null}
    </g>
  );
}

function EndpointHandle({
  fixedShapeYScale,
  point,
}: {
  fixedShapeYScale: number;
  point: { x: number; y: number };
}): ReactElement {
  return (
    <ellipse
      className="retake-annotation-endpoint"
      cx={point.x}
      cy={point.y}
      rx={0.011}
      ry={0.011 * fixedShapeYScale}
    />
  );
}

function AnnotationBadge({
  fixedShapeYScale,
  mark,
}: {
  fixedShapeYScale: number;
  mark: Exclude<AnnotationMark, { kind: 'marker' }>;
}): ReactElement {
  const anchor = mark.kind === 'pen' || mark.kind === 'brush'
    ? mark.points[0] ?? { x: 0.5, y: 0.5 }
    : mark.start;
  return (
    <g
      transform={
        `translate(${anchor.x} ${anchor.y}) `
        + `scale(1 ${fixedShapeYScale})`
      }
    >
      <circle
        fill={mark.color}
        r={0.023}
        stroke="#fff"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
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
