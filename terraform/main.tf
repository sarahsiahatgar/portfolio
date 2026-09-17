resource "aws_dynamodb_table" "staging_table" {
  name         = "staging-users-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "UserId"

  attribute {
    name = "UserId"
    type = "S"
  }

  tags = {
    Environment = "Staging"
    ManagedBy   = "Terraform"
  }
}

terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "my_website_test" {
  bucket = "my-custom-prefix-test-${random_id.bucket_suffix.hex}"

  tags = {
    Environment = "Staging"
    ManagedBy   = "Terraform"
  }
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.my_website_test.id
  description = "The name of our test S3 bucket"
}