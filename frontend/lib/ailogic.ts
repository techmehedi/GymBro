import {Audio} from 'expo-av';
import { Alert } from 'react-native';

//handle text generation, using openrouter api
const generateText = async () => {
    try{
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions',{
      method: 'POST',
      headers:{
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`
      },body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages:[
          {
            role: 'user',
            content: 'Give me motivation message for a fitness group called "GymBro" with 10 members. Dont add any emojis, this will be used in text to voice. Keep it under 100 characters.'
          }
        ]
      })
    });
    if (!response.ok){
      throw new Error(`error generating text: ${response.statusText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
    }catch(error){
      console.error('Error generating text:', error);
    }
  }
  
  export const handlePlayAudio = async () => {
    try {
      // Configure audio session for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
  
      // Get API key from environment
      const apiKey = `${process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY}`;
      const text = await generateText() || '';
      
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/A9evEp8yGjv4c3WsIKuY', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: `[excited] ${text}`,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const audioBlob = await response.blob();
      
      // Convert blob to base64 and play with expo-av
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        try {
          // Create and play the audio
          const { sound } = await Audio.Sound.createAsync(
            { uri: base64Audio },
            { shouldPlay: true, volume: 1.0 }
          );
          
          Alert.alert('Success', 'Audio is playing! 🎵');
          
          // Clean up when done
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              if (status.didJustFinish) {
                sound.unloadAsync();
              }
            }
          });
          
        } catch (playError) {
          console.error('Error playing audio:', playError);
          Alert.alert('Error', 'Failed to play audio');
        }
      };
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('Error generating audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to generate audio: ${errorMessage}`);
    }
  };