using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System;

namespace Phos.Data.Encryption
{
    /// <summary>
    /// EF Core Value Converter to automatically encrypt/decrypt string properties.
    /// </summary>
    public class EncryptedStringConverter : ValueConverter<string, string>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="EncryptedStringConverter"/> class.
        /// </summary>
        /// <param name="encryptionService">The encryption service to use.</param>
        /// <param name="mappingHints">Optional mapping hints.</param>
        public EncryptedStringConverter(
            IEncryptionService encryptionService,
            ConverterMappingHints mappingHints = null)
            : base(
                  v => encryptionService.Encrypt(v), // Convert to provider (encrypt)
                  v => encryptionService.Decrypt(v), // Convert from provider (decrypt)
                  mappingHints)
        {
            if (encryptionService == null)
            {
                throw new ArgumentNullException(nameof(encryptionService), "Encryption service cannot be null.");
            }
        }
    }
}

