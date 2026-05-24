import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

import { createId } from "@/utils/id";

const attachmentDirectory = `${FileSystem.documentDirectory ?? ""}attachments`;

const ensureAttachmentDirectoryAsync = async () => {
  const info = await FileSystem.getInfoAsync(attachmentDirectory);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(attachmentDirectory, {
      intermediates: true,
    });
  }
};

export const fileService = {
  async pickImageAttachmentAsync() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    await ensureAttachmentDirectoryAsync();

    const extension = asset.fileName?.split(".").pop() ?? "jpg";
    const localFileName = `${createId("attachment")}.${extension}`;
    const localUri = `${attachmentDirectory}/${localFileName}`;
    await FileSystem.copyAsync({
      from: asset.uri,
      to: localUri,
    });

    return {
      name: asset.fileName ?? localFileName,
      mimeType: asset.mimeType ?? "image/jpeg",
      localUri,
      sizeInBytes: asset.fileSize ?? 0,
    };
  },
};
