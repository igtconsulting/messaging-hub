# Messaging Hub

Messaging Hub is a communication and integration tool developed by **IGT Consulting s.r.o.** to assist **IBM webMethods** users in managing messaging systems more effectively.

Built to run on **IBM webMethods Integration Server** and integrated with **Universal Messaging (UM)**, Messaging Hub also supports other JMS systems like **Apache Kafka**. The platform simplifies and streamlines tasks such as:

- Configuring connections
- Managing topics
- Creating interfaces for seamless message delivery

Messaging Hub helps IBM webMethods users optimize their workflow and reduce manual effort.

## Features

- **Connection Management**: Easily configure connections to UM, Kafka, and other JMS systems.
- **Topic Management**: Create and manage topics with schemas for efficient communication.
- **Interface Creation**: Define triggers and endpoints to automate message delivery.

## Prerequisites

To use Messaging Hub, you must download and install the WxCreate package. This package provides essential functionality required for Messaging Hub to operate correctly.
Currently only WebMethods >= 11 is supported because of the streaming services added in version 11, we may add support for older versions in the future.

To download package use official link - https://github.com/SoftwareAG/webmethods-integrationserver-wxgenerate

### Installation

1. Copy the package WxGenerate to <<IS_root>>/instances/default/replicate/inbound
2. In IS Admin-GUI go to Packages->Management. Click on "Install Inbound Releases", and select "WxGenerate.zip".
3. Click "Install Release"

Ensure that the WxCreate package is up-to-date before using Messaging Hub.

## Contact Us

If you encounter any issues, need assistance, or have questions about Messaging Hub, please feel free to contact our team:

- **Email**: [support@igtconsulting.eu](mailto:support@igtconsulting.eu)

## Contribute

For source code access, bug reporting, or contributing to development, visit our GitHub repository:

- **GitHub**: [Messaging Hub Repository](https://github.com/igtconsulting/messaging-hub.git)

---

At **IGT Consulting s.r.o.**, we are dedicated to supporting the IBM webMethods community with solutions like Messaging Hub to make your work more efficient and productive.
