import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import * as tf from '@tensorflow/tfjs';
import { fetch, bundleResourceIO } from '@tensorflow/tfjs-react-native';
import * as jpeg from 'jpeg-js';
import * as nsfwjs from 'nsfwjs';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [tfReady, setTfReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [image, setImage] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      setTfReady(true);
      const loadedModel = await nsfwjs.load(
        "https://nguyenphucvuong.github.io/models/mobilenet_v2/model.json"
      );
      setModel(loadedModel);
      setModelReady(true);
    };
    loadModel();
  }, []);

  const classifyImage = async (imageUri) => {
    console.log("uri", imageUri);
    console.log("uri2", imageUri.uri);

    if (!imageUri || !imageUri.uri) {
      console.error("No image URI available");
      return;
    }

    try {
      console.log("Fetching image from URI:", imageUri.uri);

      const rawImageData = await FileSystem.readAsStringAsync(imageUri.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const imageBuffer = Uint8Array.from(atob(rawImageData), c => c.charCodeAt(0));
      const jpegData = jpeg.decode(imageBuffer, true);
      const imageTensor = imageToTensor(jpegData);

      const predictions = await model.classify(imageTensor);
      setPredictions(predictions);
    } catch (error) {
      console.error("Error classifying image:", error);
    }
  };

  const imageToTensor = (rawImageData) => {
    const { width, height, data } = rawImageData;
    const buffer = new Uint8Array(width * height * 3);
    let offset = 0;

    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset]; // Red
      buffer[i + 1] = data[offset + 1]; // Green
      buffer[i + 2] = data[offset + 2]; // Blue
      offset += 4;
    }
    return tf.tensor3d(buffer, [height, width, 3]);
  };

  const selectImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,  // Tắt chế độ chỉnh sửa ảnh
      //aspect: [4, 3],        // Tùy chọn này không cần thiết khi allowsEditing là false
      quality: 1,            // Giữ nguyên chất lượng ảnh
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedImageUri = result.assets[0].uri;
      console.log("Selected Image URI:", selectedImageUri);

      // Cập nhật state cho hình ảnh
      setImage({ uri: selectedImageUri });
      console.log("ádasdasd", { uri: selectedImageUri })
      setPredictions(null);
      classifyImage({ uri: selectedImageUri });

    } else {
      console.log("Image selection was canceled or no assets found.");
    }
  };
  const renderPrediction = (prediction) => {
    return (
      <Text key={prediction.className} style={styles.text}>
        {prediction.className}: {Math.round(prediction.probability * 100)}%
      </Text>
    );
  };

  return (
    <View>
      <StatusBar barStyle="light-content" />
      <SafeAreaView backgroundColor="#000000">
        <ScrollView style={styles.root} contentContainerStyle={styles.rootContent}>
          <View style={styles.body}>
            <Image source={require("./nsfwjs_logo.jpg")} style={styles.logo} />
            <Text style={styles.text}>TFJS: {tfReady ? "Ready" : "Loading"}</Text>
            {tfReady && <Text style={styles.text}>Model: {modelReady ? "Loaded" : "Loading"}</Text>}
            <TouchableOpacity style={styles.imageWrapper} onPress={modelReady ? selectImage : undefined}>
              {image && <Image source={image} style={styles.image} />}
              {modelReady && !image && <Text style={styles.transparentText}>Tap to choose image</Text>}
            </TouchableOpacity>
            <View style={styles.predictionWrapper}>
              {modelReady && image && <Text style={styles.text}>Predictions: {predictions ? "" : "Predicting"}</Text>}
              {modelReady && predictions && predictions.map((p) => renderPrediction(p))}
            </View>
            <View style={styles.footer}>
              <View style={styles.logoWrapper}>
                <TouchableOpacity onPress={() => Linking.openURL("https://js.tensorflow.org/")} style={styles.logoLink}>
                  <Text style={styles.poweredBy}>Powered by:</Text>
                  <Image source={require("./tfjs.jpg")} style={styles.tfLogo} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL("https://infinite.red")} style={styles.logoLink}>
                  <Text style={styles.presentedBy}>Presented by:</Text>
                  <Image source={require("./ir-logo.png")} style={styles.irLogo} />
                </TouchableOpacity>
              </View>
              <Text style={styles.resources}>Resources:</Text>
              <View style={styles.links}>
                <Text onPress={() => Linking.openURL("https://github.com/infinitered/nsfwjs-mobile/")} style={styles.text}>GitHub</Text>
                <Text onPress={() => Linking.openURL("https://github.com/infinitered/nsfwjs")} style={styles.text}>NSFWJS GitHub</Text>
                <Text onPress={() => Linking.openURL("https://shift.infinite.red/avoid-nightmares-nsfw-js-ab7b176978b1")} style={styles.text}>Blog Post</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    height: "100%",
  },
  rootContent: {
    width: "100%",
    height: "100%",
    backgroundColor: '#000000',
    marginBottom: 50,
  },
  body: {
    flex: 1,
    backgroundColor: '#000000',
    flexDirection: 'column',
    alignItems: "center",
    color: '#ffffff',
  },
  text: {
    color: '#ffffff',
  },
  logo: {
    width: 300,
    height: 120,
  },
  imageWrapper: {
    width: 280,
    height: 280,
    padding: 10,
    borderColor: '#02bbd7',
    borderWidth: 5,
    borderStyle: "dashed",
    marginTop: 10,
    marginBottom: 10,
    position: 'relative',
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: 10,
    left: 10,
    bottom: 10,
    right: 10,
  },
  transparentText: {
    color: "#ffffff",
    opacity: 0.7,
  },
  predictionWrapper: {
    height: 100,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
  },
  logoWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  logoLink: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  poweredBy: {
    fontSize: 20,
    color: "#e69e34",
    marginBottom: 6,
  },
  tfLogo: {
    width: 125,
    height: 70,
  },
  presentedBy: {
    fontSize: 20,
    color: "#e72f36",
    marginBottom: 8,
  },
  irLogo: {
    width: 150,
    height: 64,
  },
  resources: {
    marginTop: 10,
    color: "#ffffff",
  },
  links: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 10,
    marginBottom: 25,
  },
});

