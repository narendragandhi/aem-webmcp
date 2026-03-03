# WebMCP, MediaPipe & LiteRT for AEM - Practical Guide

## What Are These Technologies?

| Technology | What It Does | Use Case |
|------------|---------------|----------|
| **WebMCP** | Browser API for AI agents to interact with websites | Expose AEM components to AI agents |
| **MediaPipe** | Google's ML framework for vision/audio | Image tagging, face detection, pose detection |
| **LiteRT** | On-device AI inference (formerly TensorFlow Lite) | Run small LLMs in browser |

---

## Effective Use Cases for AEM

### 1. Content Management

| Use Case | Technology | Benefit |
|----------|------------|---------|
| Auto-tag DAM assets | MediaPipe | No manual tagging |
| Image alt-text generation | MediaPipe + LiteRT | Accessibility |
| Content search | WebMCP | AI-powered search |
| Smart forms | WebMCP | Auto-fill, validation |

### 2. User Experience

| Use Case | Technology | Benefit |
|----------|------------|---------|
| Face detection for cropping | MediaPipe | Smart image focal points |
| Gesture navigation | MediaPipe | Hands-free browsing |
| Personalized content | LiteRT | On-device recommendations |
| Voice commands | MediaPipe | Accessibility |

### 3. E-Commerce

| Use Case | Technology | Benefit |
|----------|------------|---------|
| Visual product search | MediaPipe | Find similar products |
| Virtual try-on | MediaPipe | AR experiences |
| Size recommendations | LiteRT | AI sizing |
| Chatbot | LiteRT | On-device assistant |

---

## How They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌────────────┐    ┌──────────────────┐   │
│  │  WebMCP  │◄───│   LiteRT   │◄───│    MediaPipe     │   │
│  │ (Agent   │    │ (LLM &     │    │ (Vision/Audio    │   │
│  │  API)    │    │  Inference)│    │  ML Models)      │   │
│  └──────────┘    └────────────┘    └──────────────────┘   │
│        │                 │                    │              │
│        ▼                 ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AEM Components                          │    │
│  │  • Recipe Generator  • Image Tagger  • Search      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## MediaPipe Models Available

### Vision
- **Image Classification** - What's in the image?
- **Object Detection** - Where are objects?
- **Face Detection** - Find faces
- **Pose Detection** - Body landmarks
- **Hand Tracking** - Hand gestures
- **Segmentation** - Cut out subjects

### Audio
- **Speech Recognition** - Speech to text
- **Audio Classification** - Sound detection

### Generation (LiteRT)
- **Gemma** - Google's small LLM
- **Phi** - Microsoft's small LLM

---

## Quick Examples

### 1. Face Detection for Profile Images

```javascript
// Detect faces in uploaded image
const faceDetector = await FaceDetector.createFromOptions({
    model: 'short',
    runningMode: 'IMAGE'
});

const faces = faceDetector.detect(imageElement);
console.log(faces.detections.length + ' faces found');
```

### 2. Pose Detection for Fitness Content

```javascript
const poseDetector = await PoseDetector.createFromOptions({
    model: 'lite',
    runningMode: 'VIDEO'
});

// Track user in real-time
poseDetector.onResults(results => {
    console.log('Keypoints:', results.poseLandmarks);
});
```

### 3. On-Device LLM with LiteRT

```javascript
import { loadLiteRt } from '@litertjs/core';

// Load Gemma model
await loadLiteRt('https://cdn.jsdelivr.net/npm/@litertjs/core/wasm/');

// Generate response
const response = await model.generate('Suggest a recipe for dinner');
console.log(response);
```

### 4. Smart Image Cropping

```javascript
// Use face detection to crop to face
const faces = faceDetector.detect(image);
if (faces.length > 0) {
    const face = faces[0].boundingBox;
    // Crop image to center on face
    const cropped = cropImage(image, face);
}
```

---

## AEM Integration Patterns

### Pattern 1: Client-Side Enhancement
```
AEM Page → ClientLib loads → MediaPipe/LiteRT runs in browser
```
- No server impact
- Privacy-friendly (data stays local)
- Works offline

### Pattern 2: Hybrid Processing
```
AEM Page → ClientLib → Process locally → Submit to AEM
```
- Best of both worlds
- Heavy processing on client
- Results stored in AEM

### Pattern 3: AI Agent Interaction
```
AI Agent → WebMCP API → AEM Components → User
```
- Natural language control
- Automated workflows
- 24/7 assistance

---

## Performance Tips

### MediaPipe
- Use `GPU` delegate for faster inference
- Choose smaller models (`lite` vs `full`)
- Process in Web Workers for smooth UI

### LiteRT
- Use quantized models (smaller, faster)
- Preload model on page load
- Cache model in Service Worker

### WebMCP
- Enable consent only when needed
- Use debug mode in development
- Minimize exposed actions

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebMCP (native) | 146+ | ❌ | ❌ | 146+ |
| WebGPU | 113+ | ✅ | ✅ | ✅ |
| WebAssembly | ✅ | ✅ | ✅ | ✅ |
| MediaPipe | ✅ | ✅ | ✅ | ✅ |
| LiteRT | ✅ | ✅ | ✅ | ✅ |

---

## Getting Started Code

```html
<!-- Include MediaPipe -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js"></script>

<!-- Use in your component -->
<script>
const classifier = await ImageClassifier.createFromOptions(mp, {
    baseOptions: { modelAssetPath: '...tflite' },
    maxResults: 5
});

const results = classifier.classify(imageElement);
console.log(results);
</script>
```

---

## Summary

| Technology | Best For | Complexity |
|------------|----------|------------|
| WebMCP | AI agent integration | Low |
| MediaPipe | Image/video ML | Medium |
| LiteRT | On-device LLM | High |

Start with **WebMCP** for AI agents, add **MediaPipe** for image features, then scale to **LiteRT** for full on-device AI.
