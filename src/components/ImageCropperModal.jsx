import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  PanResponder,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResponsiveMetrics } from '../utils/responsive';

export const ImageCropperModal = ({
  visible,
  image,
  onClose,
  onCrop,
  onPickAnother,
  isUploading = false,
  initialShape = 'square',
}) => {
  const { sp, fs, width: screenWidth, height: screenHeight } = useResponsiveMetrics();

  // Viewport container dimensions
  const containerW = screenWidth;
  const containerH = Math.round(Math.min(screenHeight * 0.48, 380));

  // Natural image dimensions & transform state
  const [origDimensions, setOrigDimensions] = useState({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [cropShape, setCropShape] = useState(initialShape); // 'circle' | 'square' | 'free'
  const [activeHandle, setActiveHandle] = useState(null);

  // Dynamic resizable crop box { x, y, width, height } in container coordinates
  const [cropBox, setCropBox] = useState({ x: 40, y: 40, width: 220, height: 220 });

  // Refs for gesture tracking to avoid stale closures in PanResponder
  const cropBoxRef = useRef({ x: 40, y: 40, width: 220, height: 220 });
  const startBoxRef = useRef({ x: 40, y: 40, width: 220, height: 220 });
  const activeHandleRef = useRef(null);
  const cropShapeRef = useRef(initialShape);

  useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);

  useEffect(() => {
    cropShapeRef.current = cropShape;
  }, [cropShape]);

  // Effective dimensions based on rotation
  const isFlipped = rotation === 90 || rotation === 270;
  const origW = origDimensions.width || 800;
  const origH = origDimensions.height || 800;
  const effW = isFlipped ? origH : origW;
  const effH = isFlipped ? origW : origH;

  // Fit image inside container with padding
  const fitPadding = sp(16);
  const availW = containerW - fitPadding * 2;
  const availH = containerH - fitPadding * 2;
  const fitScale = Math.min(availW / effW, availH / effH);

  const displayW = Math.round(effW * fitScale);
  const displayH = Math.round(effH * fitScale);
  const imgLeft = Math.round((containerW - displayW) / 2);
  const imgTop = Math.round((containerH - displayH) / 2);

  // Bounds for the crop box
  const minX = imgLeft;
  const maxX = imgLeft + displayW;
  const minY = imgTop;
  const maxY = imgTop + displayH;
  const MIN_SIZE = sp(50);

  // Initialize or reset crop box centered on image
  const resetCropBoxToImage = useCallback(
    (shape = cropShape) => {
      if (displayW <= 0 || displayH <= 0) return;
      if (shape === 'free') {
        const initW = Math.round(displayW * 0.85);
        const initH = Math.round(displayH * 0.85);
        const newBox = {
          x: imgLeft + Math.round((displayW - initW) / 2),
          y: imgTop + Math.round((displayH - initH) / 2),
          width: initW,
          height: initH,
        };
        setCropBox(newBox);
        cropBoxRef.current = newBox;
      } else {
        const side = Math.round(Math.min(displayW, displayH) * 0.82);
        const newBox = {
          x: imgLeft + Math.round((displayW - side) / 2),
          y: imgTop + Math.round((displayH - side) / 2),
          width: side,
          height: side,
        };
        setCropBox(newBox);
        cropBoxRef.current = newBox;
      }
    },
    [displayW, displayH, imgLeft, imgTop, cropShape]
  );

  // Load natural dimensions whenever image changes
  useEffect(() => {
    if (!visible || !image || !image.uri) return;

    setRotation(0);
    setCropShape(initialShape);
    cropShapeRef.current = initialShape;
    if (image.width && image.height && image.width > 0 && image.height > 0) {
      setOrigDimensions({ width: image.width, height: image.height });
    } else {
      Image.getSize(
        image.uri,
        (w, h) => setOrigDimensions({ width: w, height: h }),
        () => setOrigDimensions({ width: 800, height: 800 })
      );
    }
  }, [visible, image && image.uri, initialShape]);

  // Center crop box once dimensions are ready
  useEffect(() => {
    if (displayW > 0 && displayH > 0) {
      resetCropBoxToImage();
    }
  }, [displayW, displayH, rotation]);

  // Detect which handle (edge, corner, or body) was tapped
  const getHandleAtPoint = (tx, ty, box) => {
    const CORNER_RADIUS = sp(36);
    const EDGE_RADIUS = sp(30);

    const bL = box.x;
    const bT = box.y;
    const bR = box.x + box.width;
    const bB = box.y + box.height;

    // 1. Corners (highest priority)
    if (Math.hypot(tx - bL, ty - bT) <= CORNER_RADIUS) return 'tl';
    if (Math.hypot(tx - bR, ty - bT) <= CORNER_RADIUS) return 'tr';
    if (Math.hypot(tx - bL, ty - bB) <= CORNER_RADIUS) return 'bl';
    if (Math.hypot(tx - bR, ty - bB) <= CORNER_RADIUS) return 'br';

    // 2. Edges (left, right, top, bottom)
    if (Math.abs(tx - bL) <= EDGE_RADIUS && ty >= bT - EDGE_RADIUS && ty <= bB + EDGE_RADIUS) return 'left';
    if (Math.abs(tx - bR) <= EDGE_RADIUS && ty >= bT - EDGE_RADIUS && ty <= bB + EDGE_RADIUS) return 'right';
    if (Math.abs(ty - bT) <= EDGE_RADIUS && tx >= bL - EDGE_RADIUS && tx <= bR + EDGE_RADIUS) return 'top';
    if (Math.abs(ty - bB) <= EDGE_RADIUS && tx >= bL - EDGE_RADIUS && tx <= bR + EDGE_RADIUS) return 'bottom';

    // 3. Inside crop box
    if (tx >= bL && tx <= bR && ty >= bT && ty <= bB) return 'move';

    // 4. Outside proximity
    if (tx < bL && Math.abs(tx - bL) <= sp(50) && ty >= bT && ty <= bB) return 'left';
    if (tx > bR && Math.abs(tx - bR) <= sp(50) && ty >= bT && ty <= bB) return 'right';
    if (ty < bT && Math.abs(ty - bT) <= sp(50) && tx >= bL && tx <= bR) return 'top';
    if (ty > bB && Math.abs(ty - bB) <= sp(50) && tx >= bL && tx <= bR) return 'bottom';

    return 'move';
  };

  // PanResponder to handle dragging edges, corners, and moving the crop box
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const handle = getHandleAtPoint(locationX, locationY, cropBoxRef.current);
          activeHandleRef.current = handle;
          setActiveHandle(handle);
          startBoxRef.current = { ...cropBoxRef.current };
        },
        onPanResponderMove: (evt, gestureState) => {
          const handle = activeHandleRef.current;
          if (!handle) return;

          const start = startBoxRef.current;
          const { dx, dy } = gestureState;
          const shape = cropShapeRef.current;
          const isSquareLocked = shape === 'circle' || shape === 'square';

          let nextX = start.x;
          let nextY = start.y;
          let nextW = start.width;
          let nextH = start.height;

          if (handle === 'move') {
            nextX = Math.min(maxX - start.width, Math.max(minX, start.x + dx));
            nextY = Math.min(maxY - start.height, Math.max(minY, start.y + dy));
          } else if (handle === 'left') {
            // Swipe left edge to right / left
            const targetLeft = Math.min(start.x + start.width - MIN_SIZE, Math.max(minX, start.x + dx));
            let w = start.x + start.width - targetLeft;
            if (isSquareLocked) {
              w = Math.min(w, maxY - start.y);
              nextX = start.x + start.width - w;
              nextW = w;
              nextH = w;
            } else {
              nextX = targetLeft;
              nextW = w;
            }
          } else if (handle === 'right') {
            // Swipe right edge
            const targetRight = Math.max(start.x + MIN_SIZE, Math.min(maxX, start.x + start.width + dx));
            let w = targetRight - start.x;
            if (isSquareLocked) {
              w = Math.min(w, maxY - start.y);
              nextW = w;
              nextH = w;
            } else {
              nextW = w;
            }
          } else if (handle === 'top') {
            // Swipe top edge
            const targetTop = Math.min(start.y + start.height - MIN_SIZE, Math.max(minY, start.y + dy));
            let h = start.y + start.height - targetTop;
            if (isSquareLocked) {
              h = Math.min(h, maxX - start.x);
              nextY = start.y + start.height - h;
              nextW = h;
              nextH = h;
            } else {
              nextY = targetTop;
              nextH = h;
            }
          } else if (handle === 'bottom') {
            // Swipe bottom edge to top / bottom
            const targetBottom = Math.max(start.y + MIN_SIZE, Math.min(maxY, start.y + start.height + dy));
            let h = targetBottom - start.y;
            if (isSquareLocked) {
              h = Math.min(h, maxX - start.x);
              nextW = h;
              nextH = h;
            } else {
              nextH = h;
            }
          } else if (handle === 'tl') {
            // Corner Top-Left
            const targetLeft = Math.min(start.x + start.width - MIN_SIZE, Math.max(minX, start.x + dx));
            const targetTop = Math.min(start.y + start.height - MIN_SIZE, Math.max(minY, start.y + dy));
            let w = start.x + start.width - targetLeft;
            let h = start.y + start.height - targetTop;
            if (isSquareLocked) {
              const side = Math.min(w, h);
              nextX = start.x + start.width - side;
              nextY = start.y + start.height - side;
              nextW = side;
              nextH = side;
            } else {
              nextX = targetLeft;
              nextY = targetTop;
              nextW = w;
              nextH = h;
            }
          } else if (handle === 'tr') {
            // Corner Top-Right
            const targetRight = Math.max(start.x + MIN_SIZE, Math.min(maxX, start.x + start.width + dx));
            const targetTop = Math.min(start.y + start.height - MIN_SIZE, Math.max(minY, start.y + dy));
            let w = targetRight - start.x;
            let h = start.y + start.height - targetTop;
            if (isSquareLocked) {
              const side = Math.min(w, h);
              nextY = start.y + start.height - side;
              nextW = side;
              nextH = side;
            } else {
              nextY = targetTop;
              nextW = w;
              nextH = h;
            }
          } else if (handle === 'bl') {
            // Corner Bottom-Left
            const targetLeft = Math.min(start.x + start.width - MIN_SIZE, Math.max(minX, start.x + dx));
            const targetBottom = Math.max(start.y + MIN_SIZE, Math.min(maxY, start.y + start.height + dy));
            let w = start.x + start.width - targetLeft;
            let h = targetBottom - start.y;
            if (isSquareLocked) {
              const side = Math.min(w, h);
              nextX = start.x + start.width - side;
              nextW = side;
              nextH = side;
            } else {
              nextX = targetLeft;
              nextW = w;
              nextH = h;
            }
          } else if (handle === 'br') {
            // Corner Bottom-Right
            const targetRight = Math.max(start.x + MIN_SIZE, Math.min(maxX, start.x + start.width + dx));
            const targetBottom = Math.max(start.y + MIN_SIZE, Math.min(maxY, start.y + start.height + dy));
            let w = targetRight - start.x;
            let h = targetBottom - start.y;
            if (isSquareLocked) {
              const side = Math.min(w, h);
              nextW = side;
              nextH = side;
            } else {
              nextW = w;
              nextH = h;
            }
          }

          setCropBox({
            x: Math.round(nextX),
            y: Math.round(nextY),
            width: Math.round(nextW),
            height: Math.round(nextH),
          });
        },
        onPanResponderRelease: () => {
          activeHandleRef.current = null;
          setActiveHandle(null);
        },
        onPanResponderTerminate: () => {
          activeHandleRef.current = null;
          setActiveHandle(null);
        },
      }),
    [minX, maxX, minY, maxY, MIN_SIZE]
  );

  const handleSetMode = (mode) => {
    setCropShape(mode);
    resetCropBoxToImage(mode);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    resetCropBoxToImage(cropShape);
  };

  // Compute final crop coordinates in original/rotated image space
  const handleConfirm = () => {
    if (fitScale <= 0) return;

    const relX = cropBox.x - imgLeft;
    const relY = cropBox.y - imgTop;
    const cropX = relX / fitScale;
    const cropY = relY / fitScale;
    const cropW = cropBox.width / fitScale;
    const cropH = cropBox.height / fitScale;

    const clampedX = Math.max(0, Math.min(effW - 10, cropX));
    const clampedY = Math.max(0, Math.min(effH - 10, cropY));
    const clampedW = Math.max(10, Math.min(effW - clampedX, cropW));
    const clampedH = Math.max(10, Math.min(effH - clampedY, cropH));

    const cropOptions = {
      rotation,
      shape: cropShape,
      crop: {
        x: clampedX,
        y: clampedY,
        width: clampedW,
        height: clampedH,
      },
      original: {
        width: origW,
        height: origH,
      },
    };

    if (typeof onCrop === 'function') {
      onCrop({ cropOptions });
    }
  };

  const maskRadius =
    cropShape === 'circle'
      ? cropBox.width / 2
      : cropShape === 'square'
      ? sp(6)
      : 0;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={isUploading ? () => {} : onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isUploading}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <Feather name="x" size={sp(22)} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Crop Profile Photo</Text>
              <Text style={styles.headerSubtitle}>Swipe edges & corners to crop</Text>
            </View>

            <TouchableOpacity
              onPress={handleReset}
              disabled={isUploading}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="refresh" size={sp(22)} color="#0055FF" />
            </TouchableOpacity>
          </View>

          {/* Mode Selector Tabs: Circle vs 1:1 Square vs Freeform */}
          <View style={styles.shapeSelectorWrap}>
            <TouchableOpacity
              style={[styles.shapeSegment, cropShape === 'circle' && styles.shapeSegmentActive]}
              onPress={() => handleSetMode('circle')}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="circle-outline"
                size={sp(14)}
                color={cropShape === 'circle' ? '#FFFFFF' : '#8E8E93'}
                style={{ marginRight: sp(5) }}
              />
              <Text
                style={[
                  styles.shapeSegmentText,
                  cropShape === 'circle' && styles.shapeSegmentTextActive,
                ]}
              >
                Circle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shapeSegment, cropShape === 'square' && styles.shapeSegmentActive]}
              onPress={() => handleSetMode('square')}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="square-outline"
                size={sp(14)}
                color={cropShape === 'square' ? '#FFFFFF' : '#8E8E93'}
                style={{ marginRight: sp(5) }}
              />
              <Text
                style={[
                  styles.shapeSegmentText,
                  cropShape === 'square' && styles.shapeSegmentTextActive,
                ]}
              >
                1:1 Square
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shapeSegment, cropShape === 'free' && styles.shapeSegmentActive]}
              onPress={() => handleSetMode('free')}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="crop-free"
                size={sp(15)}
                color={cropShape === 'free' ? '#FFFFFF' : '#8E8E93'}
                style={{ marginRight: sp(5) }}
              />
              <Text
                style={[
                  styles.shapeSegmentText,
                  cropShape === 'free' && styles.shapeSegmentTextActive,
                ]}
              >
                Freeform
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instruction Tagline */}
          <Text style={styles.interactiveHint}>
            Swipe left/right or bottom/top edges to adjust • Drag box to move
          </Text>

          {/* Interactive Crop Viewport */}
          <View
            style={[styles.viewportContainer, { width: containerW, height: containerH }]}
            {...panResponder.panHandlers}
          >
            {/* Layer 1: Dimmed Background Image */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              {Boolean(image && image.uri && displayW > 0) && (
                <Image
                  source={{ uri: image.uri }}
                  style={{
                    position: 'absolute',
                    left: imgLeft,
                    top: imgTop,
                    width: isFlipped ? displayH : displayW,
                    height: isFlipped ? displayW : displayH,
                    marginLeft: isFlipped ? (displayW - displayH) / 2 : 0,
                    marginTop: isFlipped ? (displayH - displayW) / 2 : 0,
                    opacity: 0.28,
                    transform: [{ rotate: `${rotation}deg` }],
                  }}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Layer 2: Cutout Box (100% Bright Content Inside Crop Area) */}
            <View
              style={[
                styles.cropCutout,
                {
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.width,
                  height: cropBox.height,
                  borderRadius: maskRadius,
                },
              ]}
              pointerEvents="none"
            >
              {Boolean(image && image.uri && displayW > 0) && (
                <Image
                  source={{ uri: image.uri }}
                  style={{
                    position: 'absolute',
                    left: imgLeft - cropBox.x,
                    top: imgTop - cropBox.y,
                    width: isFlipped ? displayH : displayW,
                    height: isFlipped ? displayW : displayH,
                    marginLeft: isFlipped ? (displayW - displayH) / 2 : 0,
                    marginTop: isFlipped ? (displayH - displayW) / 2 : 0,
                    opacity: 1.0,
                    transform: [{ rotate: `${rotation}deg` }],
                  }}
                  resizeMode="cover"
                />
              )}

              {/* Rule of Thirds Grid Lines */}
              <View style={styles.gridOverlay} pointerEvents="none">
                <View style={[styles.gridLineV, { left: '33.3%' }]} />
                <View style={[styles.gridLineV, { left: '66.6%' }]} />
                <View style={[styles.gridLineH, { top: '33.3%' }]} />
                <View style={[styles.gridLineH, { top: '66.6%' }]} />
              </View>
            </View>

            {/* Layer 3: Crop Box Border & Interactive Swipe Handles */}
            <View
              style={[
                styles.cropBorderBox,
                {
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.width,
                  height: cropBox.height,
                  borderRadius: maskRadius,
                  borderColor: activeHandle ? '#0055FF' : '#FFFFFF',
                  borderWidth: cropShape === 'circle' ? 2.5 : 1.5,
                },
              ]}
              pointerEvents="none"
            >
              {/* Corner Brackets */}
              <View style={[styles.cornerBracket, styles.bracketTL, activeHandle === 'tl' && styles.bracketActive]} />
              <View style={[styles.cornerBracket, styles.bracketTR, activeHandle === 'tr' && styles.bracketActive]} />
              <View style={[styles.cornerBracket, styles.bracketBL, activeHandle === 'bl' && styles.bracketActive]} />
              <View style={[styles.cornerBracket, styles.bracketBR, activeHandle === 'br' && styles.bracketActive]} />

              {/* Edge Swipe Handle Bars (Left, Right, Top, Bottom) */}
              {cropShape !== 'circle' && (
                <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                  {/* Left Edge Handle (Swipe Left to Right) */}
                  <View style={[styles.edgeHandleV, styles.handleLeft, activeHandle === 'left' && styles.edgeHandleActive]} />
                  {/* Right Edge Handle */}
                  <View style={[styles.edgeHandleV, styles.handleRight, activeHandle === 'right' && styles.edgeHandleActive]} />
                  {/* Top Edge Handle */}
                  <View style={[styles.edgeHandleH, styles.handleTop, activeHandle === 'top' && styles.edgeHandleActive]} />
                  {/* Bottom Edge Handle (Swipe Bottom to Top) */}
                  <View style={[styles.edgeHandleH, styles.handleBottom, activeHandle === 'bottom' && styles.edgeHandleActive]} />
                </View>
              )}
            </View>
          </View>

          {/* Quick Toolbar */}
          <View style={styles.toolbarRow}>
            {/* Rotate Button */}
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={handleRotate}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="rotate-right" size={sp(20)} color="#FFFFFF" />
              <Text style={styles.toolBtnText}>
                {rotation > 0 ? `${rotation}°` : 'Rotate 90°'}
              </Text>
            </TouchableOpacity>

            {/* Re-center Button */}
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => resetCropBoxToImage()}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              <Feather name="maximize-2" size={sp(18)} color="#FFFFFF" />
              <Text style={styles.toolBtnText}>Fit & Center</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            {onPickAnother && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onPickAnother}
                disabled={isUploading}
                activeOpacity={0.7}
              >
                <Feather name="image" size={sp(16)} color="#FFFFFF" style={{ marginRight: sp(6) }} />
                <Text style={styles.secondaryBtnText}>Choose Another</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                !onPickAnother && { flex: 1 },
                isUploading && { opacity: 0.75 },
              ]}
              onPress={handleConfirm}
              disabled={isUploading}
              activeOpacity={0.85}
            >
              {isUploading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.primaryBtnText, { marginLeft: sp(8) }]}>
                    Cropping & Uploading...
                  </Text>
                </View>
              ) : (
                <View style={styles.confirmRow}>
                  <Feather name="check" size={sp(18)} color="#FFFFFF" style={{ marginRight: sp(6) }} />
                  <Text style={styles.primaryBtnText}>Crop & Save</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  shapeSelectorWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    padding: 3,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  shapeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  shapeSegmentActive: {
    backgroundColor: '#0055FF',
    shadowColor: '#0055FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  shapeSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  shapeSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  interactiveHint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#6E7681',
    marginTop: 4,
    fontWeight: '500',
  },
  viewportContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  cropCutout: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  cropBorderBox: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  cornerBracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
  },
  bracketActive: {
    borderColor: '#0055FF',
  },
  bracketTL: {
    top: -2.5,
    left: -2.5,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 5,
  },
  bracketTR: {
    top: -2.5,
    right: -2.5,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 5,
  },
  bracketBL: {
    bottom: -2.5,
    left: -2.5,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 5,
  },
  bracketBR: {
    bottom: -2.5,
    right: -2.5,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 5,
  },
  edgeHandleV: {
    position: 'absolute',
    top: '50%',
    marginTop: -14,
    width: 5,
    height: 28,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
  },
  edgeHandleH: {
    position: 'absolute',
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
  },
  handleLeft: {
    left: -3.5,
  },
  handleRight: {
    right: -3.5,
  },
  handleTop: {
    top: -3.5,
  },
  handleBottom: {
    bottom: -3.5,
  },
  edgeHandleActive: {
    backgroundColor: '#0055FF',
    transform: [{ scale: 1.2 }],
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    marginVertical: 4,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#0055FF',
    shadowColor: '#0055FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImageCropperModal;
