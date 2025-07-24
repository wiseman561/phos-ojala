using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Ojala.Data.Encryption
{
    public interface IEncryptionService
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherText);
    }

    public class AesEncryptionService : IEncryptionService, IDisposable
    {
        private readonly byte[] _key;
        private readonly Aes _aes;

        public AesEncryptionService(IConfiguration configuration)
        {
            // Key MUST be securely managed (e.g., via Vault) and provided via configuration.
            // It should be a Base64 encoded string representing 32 bytes for AES-256.
            var base64Key = configuration["Encryption:AesKey"];
            if (string.IsNullOrEmpty(base64Key))
            {
                throw new InvalidOperationException("Encryption:AesKey is not configured. Please provide a Base64 encoded 32-byte key via configuration (e.g., Vault).");
            }

            try
            {
                _key = Convert.FromBase64String(base64Key);
                if (_key.Length != 32) // 256 bits
                {
                    throw new ArgumentException("Encryption:AesKey must be a Base64 encoded 32-byte key.");
                }
            }
            catch (FormatException ex)
            {
                throw new ArgumentException("Encryption:AesKey is not a valid Base64 string.", ex);
            }

            _aes = Aes.Create();
            _aes.Key = _key;
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
                return plainText;

            _aes.GenerateIV();
            var iv = _aes.IV;

            using var encryptor = _aes.CreateEncryptor(_aes.Key, iv);
            using var msEncrypt = new MemoryStream();
            // Prepend IV to the ciphertext
            msEncrypt.Write(iv, 0, iv.Length);
            using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
            using (var swEncrypt = new StreamWriter(csEncrypt, Encoding.UTF8))
            {
                swEncrypt.Write(plainText);
            }

            return Convert.ToBase64String(msEncrypt.ToArray());
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText))
                return cipherText;

            byte[] fullCipher = Convert.FromBase64String(cipherText);

            // Extract IV from the beginning of the cipher text
            byte[] iv = new byte[16]; // AES IV is always 16 bytes
            if (fullCipher.Length < iv.Length)
                throw new ArgumentException("Invalid cipher text length");

            Array.Copy(fullCipher, 0, iv, 0, iv.Length);
            _aes.IV = iv;

            using var decryptor = _aes.CreateDecryptor(_aes.Key, _aes.IV);
            using var msDecrypt = new MemoryStream(fullCipher, iv.Length, fullCipher.Length - iv.Length);
            using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using var srDecrypt = new StreamReader(csDecrypt, Encoding.UTF8);
            
            return srDecrypt.ReadToEnd();
        }

        public void Dispose()
        {
            _aes?.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}

